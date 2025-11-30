import JSZip from 'jszip';
import { v4 as uuidv4 } from 'uuid';
import { marked } from 'marked';
import FileSaver from 'file-saver';
import { 
  Chapter, 
  InteractiveBookContent, 
  H5PContentObject, 
  H5PMetadata, 
  AccordionParams, 
  SingleChoiceSetParams,
  SingleChoice,
  ImageParams,
  VideoParams,
  BlanksParams,
  DragTextParams
} from '../types';

interface H5PDependency {
  machineName: string;
  majorVersion: number;
  minorVersion: number;
}

interface H5PManifest {
  title: string;
  mainLibrary: string;
  preloadedDependencies: H5PDependency[];
}

interface ContentBlock {
  type: 'text' | 'accordion' | 'quiz' | 'image' | 'video' | 'fill' | 'drag';
  lines: string[];
}

interface LibraryVersions {
  column: string;
  text: string;
  isAdvancedText: boolean;
  accordion: string | null;
  singleChoice: string | null;
  image: string | null;
  video: string | null;
  blanks: string | null;
  dragText: string | null;
}

/**
 * Validates if the provided buffer is a valid H5P Interactive Book template.
 */
export const validateTemplate = async (buffer: ArrayBuffer): Promise<string | null> => {
  try {
    const zip = new JSZip();
    await zip.loadAsync(buffer);

    const h5pJsonFile = zip.file("h5p.json");
    if (!h5pJsonFile) {
      return "Invalid H5P: h5p.json missing.";
    }

    const h5pManifestStr = await h5pJsonFile.async("string");
    const h5pManifest = JSON.parse(h5pManifestStr) as H5PManifest;

    // We accept any version of InteractiveBook
    if (!h5pManifest.mainLibrary || !h5pManifest.mainLibrary.startsWith("H5P.InteractiveBook")) {
      return `Template is not an Interactive Book. Main library is: ${h5pManifest.mainLibrary}`;
    }

    return null;
  } catch (e: any) {
    return `Corrupt template file: ${e.message}`;
  }
};

/**
 * Helper to sanitise HTML content for H5P.
 */
const processHtmlContent = (rawHtml: string): string => {
  let html = rawHtml;
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  html = html.replace(imgRegex, (match, src) => {
    const filename = src.split(/[/\\]/).pop() || 'Image';
    return `<div style="background-color:#f8fafc;border:1px dashed #cbd5e1;border-radius:8px;padding:16px;margin:16px 0;text-align:center;color:#64748b;font-family:sans-serif;font-size:0.9em;"><p style="margin:0;font-weight:600;">Image Placeholder: ${filename}</p></div>`;
  });
  html = html.replace(/<table>/g, '<table class="h5p-table">');
  return html;
};

/**
 * DYNAMIC VERSION HELPER
 * Finds the correct "MachineName Major.Minor" string.
 * 1. Checks h5p.json preloadedDependencies.
 * 2. Checks if a folder exists in the ZIP (fallback for sub-dependencies).
 * 3. Returns a fallback default if not found (to prevent crashes).
 */
const getLibVersion = (
  zip: JSZip, 
  deps: H5PDependency[], 
  machineName: string, 
  defaultVersion: string
): string => {
  // 1. Look in h5p.json dependencies
  const dep = deps.find(d => d.machineName === machineName);
  if (dep) {
    return `${dep.machineName} ${dep.majorVersion}.${dep.minorVersion}`;
  }

  // 2. Look for folder in ZIP (e.g. "H5P.InteractiveBook-1.2/")
  // This is crucial for libraries not listed in the root manifest.
  const prefix = `${machineName}-`;
  const foundFolder = Object.keys(zip.files).find(path => path.startsWith(prefix) && path.includes('/'));
  
  if (foundFolder) {
    // Extract "1.2" from "H5P.InteractiveBook-1.2/"
    const folderName = foundFolder.split('/')[0];
    const versionPart = folderName.replace(prefix, '');
    if (versionPart.match(/^\d+\.\d+$/)) {
      return `${machineName} ${versionPart}`;
    }
  }

  // 3. Fallback (console warning for debugging)
  console.warn(`Library ${machineName} not found in template. Using default: ${defaultVersion}`);
  return `${machineName} ${defaultVersion}`;
};


/**
 * --------------------------------------------------------------------------
 * Content Builders
 * --------------------------------------------------------------------------
 */

const createMetadata = (title: string, contentType: string): H5PMetadata => ({
  license: "U",
  title: title,
  authors: [],
  changes: [],
  contentType: contentType
});

const buildTextObject = async (markdown: string, libs: LibraryVersions, fallbackTitle?: string): Promise<H5PContentObject> => {
  const parsed = await marked.parse(markdown);
  let htmlContent = processHtmlContent(parsed as string);
  
  if (fallbackTitle) {
      htmlContent = `<div style="border:1px solid #e2e8f0; padding: 10px; background: #fff1f2; border-radius: 4px; color: #be123c; margin-bottom: 10px;"><strong>Missing Library:</strong> ${fallbackTitle}</div>${htmlContent}`;
  }

  return {
    library: libs.text,
    params: { text: htmlContent || "<p>&nbsp;</p>" },
    subContentId: uuidv4(),
    metadata: createMetadata("Text", "Text")
  };
};

const buildAccordionObject = async (lines: string[], libs: LibraryVersions): Promise<H5PContentObject | null> => {
  // Check if library was detected (version string is not null/empty)
  if (!libs.accordion || libs.accordion.includes("null")) return null;

  const panels: { title: string; markdownLines: string[] }[] = [];
  let currentPanel: { title: string; markdownLines: string[] } | null = null;

  for (const line of lines) {
    if (line.trim().startsWith('+++')) {
      const title = line.replace(/^\+{3,}\s*/, '').trim() || "Panel";
      currentPanel = { title, markdownLines: [] };
      panels.push(currentPanel);
    } else if (currentPanel) {
      currentPanel.markdownLines.push(line);
    }
  }

  const processedPanels = await Promise.all(panels.map(async (p) => {
    const parsedHtml = await marked.parse(p.markdownLines.join('\n'));
    const finalHtml = processHtmlContent(parsedHtml as string);

    const textObj: H5PContentObject = {
      library: libs.text,
      params: { text: finalHtml || "<p></p>" },
      subContentId: uuidv4(),
      metadata: createMetadata("Panel Content", "Text")
    };

    return {
      title: p.title,
      content: textObj
    };
  }));

  const params: AccordionParams = {
    panels: processedPanels,
    hTag: "h2"
  };

  return {
    library: libs.accordion,
    params: params,
    subContentId: uuidv4(),
    metadata: createMetadata("Accordion", "Accordion")
  };
};

const buildQuizObject = (lines: string[], libs: LibraryVersions): H5PContentObject | null => {
  if (!libs.singleChoice || libs.singleChoice.includes("null")) return null;

  const choices: SingleChoice[] = [];
  let currentChoice: SingleChoice | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('?')) {
      if (currentChoice) {
        choices.push(currentChoice);
      }
      currentChoice = {
        question: trimmed.substring(1).trim(),
        answers: [],
        subContentId: uuidv4()
      };
    } else if (currentChoice) {
      if (trimmed.startsWith('*')) {
        const ans = trimmed.substring(1).trim();
        currentChoice.answers.unshift(ans); 
      } else if (trimmed.startsWith('-')) {
        const ans = trimmed.substring(1).trim();
        currentChoice.answers.push(ans);
      }
    }
  }
  if (currentChoice) {
    choices.push(currentChoice);
  }

  const params: SingleChoiceSetParams = {
    choices: choices,
    behaviour: {
      autoContinue: true,
      enableRetry: true,
      enableSolutionsButton: true,
      passPercentage: 100,
      soundEffectsEnabled: true,
      timeoutCorrect: 2000,
      timeoutWrong: 3000
    }
  };

  return {
    library: libs.singleChoice,
    params: params,
    subContentId: uuidv4(),
    metadata: createMetadata("Quiz", "Single Choice Set")
  };
};

const buildImageObject = (line: string, libs: LibraryVersions): H5PContentObject | null => {
  if (!libs.image || libs.image.includes("null")) return null;

  const match = line.match(/^!\[(.*?)\]\((.*?)\)/);
  const altText = match ? match[1] : "Image";
  
  const params: ImageParams = {
    alt: altText,
    contentName: "Image",
    file: {
      path: "images/missing.jpg",
      mime: "image/jpeg",
      copyright: { license: "U" }
    }
  };

  return {
    library: libs.image,
    params: params,
    subContentId: uuidv4(),
    metadata: createMetadata("Image Placeholder", "Image")
  };
};

const buildVideoObject = (libs: LibraryVersions): H5PContentObject | null => {
  if (!libs.video || libs.video.includes("null")) return null;

  const params: VideoParams = {
    sources: [],
    visuals: {
      fit: true,
      controls: true
    },
    playback: {
      autoplay: false,
      loop: false
    }
  };

  return {
    library: libs.video,
    params: params,
    subContentId: uuidv4(),
    metadata: createMetadata("Video Placeholder", "Video")
  };
};

const buildBlanksObject = (lines: string[], libs: LibraryVersions): H5PContentObject | null => {
  if (!libs.blanks || libs.blanks.includes("null")) return null;

  const questions = lines
    .filter(l => l.trim() !== "")
    .map(l => `<p>${l.trim()}</p>`);

  const params: BlanksParams = {
    questions: questions,
    behaviour: {
      enableRetry: true,
      enableSolutionsButton: true,
      autoRetry: true,
      caseSensitive: false,
      showSolutionsRequiresInput: true,
      separateLines: false
    }
  };

  return {
    library: libs.blanks,
    params: params,
    subContentId: uuidv4(),
    metadata: createMetadata("Cloze Test", "Fill in the Blanks")
  };
};

const buildDragTextObject = (lines: string[], libs: LibraryVersions): H5PContentObject | null => {
  if (!libs.dragText || libs.dragText.includes("null")) return null;

  const textField = lines.join('\n');

  const params: DragTextParams = {
    textField: textField,
    taskDescription: "Drag the words into the correct boxes.",
    behaviour: {
      enableRetry: true,
      enableSolutionsButton: true,
      instantFeedback: false
    }
  };

  return {
    library: libs.dragText,
    params: params,
    subContentId: uuidv4(),
    metadata: createMetadata("Drag Text", "Drag the Words")
  };
};

const parseChapterSegments = (markdown: string): ContentBlock[] => {
  const normalized = markdown.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.split('\n');
  
  const blocks: ContentBlock[] = [];
  let currentLines: string[] = [];
  let currentType: ContentBlock['type'] = 'text';

  const flush = (newType: ContentBlock['type']) => {
    if (currentLines.length > 0) {
      const hasContent = currentLines.some(l => l.trim() !== "");
      if (currentType !== 'text' || hasContent) {
        blocks.push({ type: currentType, lines: currentLines });
      }
    }
    currentType = newType;
    currentLines = [];
  };

  const imageRegex = /^!\[(.*?)\]\((.*?)\)/;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === '[ACCORDION]') flush('accordion');
    else if (trimmed === '[QUIZ]') flush('quiz');
    else if (trimmed === '[VIDEO]') flush('video');
    else if (trimmed === '[FILL]') flush('fill');
    else if (trimmed === '[DRAG]') flush('drag');
    else if (trimmed === '[TEXT]') flush('text');
    else if (imageRegex.test(trimmed) && currentType === 'text') {
      flush('text');
      blocks.push({ type: 'image', lines: [trimmed] });
      currentLines = []; 
      currentType = 'text'; 
    } else {
      currentLines.push(line);
    }
  }
  flush('text'); 

  return blocks;
};

const createChapterStructure = async (
  title: string, 
  markdownContent: string,
  libs: LibraryVersions
): Promise<Chapter> => {
  
  const segments = parseChapterSegments(markdownContent);
  const contentWrappers: any[] = [];

  for (const segment of segments) {
    let contentObj: H5PContentObject | null = null;

    if (segment.type === 'text') {
      contentObj = await buildTextObject(segment.lines.join('\n'), libs);
    } else if (segment.type === 'accordion') {
      contentObj = await buildAccordionObject(segment.lines, libs);
      if (!contentObj) contentObj = await buildTextObject(segment.lines.join('\n'), libs, "Accordion (Library missing)");
    } else if (segment.type === 'quiz') {
      contentObj = buildQuizObject(segment.lines, libs);
      if (!contentObj) contentObj = await buildTextObject(segment.lines.join('\n'), libs, "Quiz (Library missing)");
    } else if (segment.type === 'image') {
      contentObj = buildImageObject(segment.lines[0], libs);
      if (!contentObj) contentObj = await buildTextObject(segment.lines[0], libs, "Image (Library missing)");
    } else if (segment.type === 'video') {
      contentObj = buildVideoObject(libs);
      if (!contentObj) contentObj = await buildTextObject("[VIDEO PLACEHOLDER]", libs, "Video (Library missing)");
    } else if (segment.type === 'fill') {
      contentObj = buildBlanksObject(segment.lines, libs);
      if (!contentObj) contentObj = await buildTextObject(segment.lines.join('\n'), libs, "Fill in the Blanks (Library missing)");
    } else if (segment.type === 'drag') {
      contentObj = buildDragTextObject(segment.lines, libs);
      if (!contentObj) contentObj = await buildTextObject(segment.lines.join('\n'), libs, "Drag the Words (Library missing)");
    }

    if (contentObj) {
      contentWrappers.push({
        content: contentObj,
        useSeparator: "auto"
      });
    }
  }

  if (contentWrappers.length === 0) {
    const empty = await buildTextObject("<p>(Empty Chapter)</p>", libs);
    contentWrappers.push({ content: empty, useSeparator: "auto" });
  }

  return {
    subContentId: uuidv4(),
    library: libs.column,
    metadata: createMetadata(title, "Column"),
    params: { content: contentWrappers }
  };
};

/**
 * Main Build Function
 */
export const buildH5P = async (
  markdownFile: File, 
  templateBuffer: ArrayBuffer
): Promise<void> => {
  try {
    const text = await markdownFile.text();
    
    // 1. Parse Markdown
    const normalizedMarkdown = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = normalizedMarkdown.split('\n');
    const chaptersData: { title: string; content: string }[] = [];
    
    let currentTitle = "Introduction";
    let currentLines: string[] = [];
    let isImplicit = true;

    if (lines.length > 0 && lines[0].trim().startsWith('# ')) {
       isImplicit = false;
       currentTitle = "";
    }

    lines.forEach(line => {
      if (line.trim().startsWith('# ')) {
        if (currentTitle && (currentLines.length > 0 || !isImplicit)) {
          chaptersData.push({ title: currentTitle, content: currentLines.join('\n') });
        }
        currentTitle = line.replace(/^#\s+/, '').trim();
        currentLines = [];
        isImplicit = false;
      } else {
        currentLines.push(line);
      }
    });
    if (currentTitle && currentLines.length > 0) {
      chaptersData.push({ title: currentTitle, content: currentLines.join('\n') });
    }

    if (chaptersData.length === 0) {
      throw new Error("No chapters found. Use '# Chapter Title' to create pages.");
    }

    // 2. Load Zip
    const zip = new JSZip();
    await zip.loadAsync(templateBuffer);
    
    // 3. Parse h5p.json
    const h5pManifest = JSON.parse(await zip.file("h5p.json")!.async("string")) as H5PManifest;
    const deps = h5pManifest.preloadedDependencies || [];

    // 4. Resolve versions using getLibVersion (Strict dynamic)
    // We check both the manifest and the ZIP file to ensure we find the installed version.
    
    const advancedTextFound = getLibVersion(zip, deps, "H5P.AdvancedText", "");
    const textLib = advancedTextFound && !advancedTextFound.includes("undefined")
        ? advancedTextFound 
        : getLibVersion(zip, deps, "H5P.Text", "1.0");

    const libs: LibraryVersions = {
      column: getLibVersion(zip, deps, "H5P.Column", "1.13"),
      text: textLib,
      isAdvancedText: textLib.startsWith("H5P.AdvancedText"),
      accordion: getLibVersion(zip, deps, "H5P.Accordion", "1.0"),
      singleChoice: getLibVersion(zip, deps, "H5P.SingleChoiceSet", "1.11"),
      image: getLibVersion(zip, deps, "H5P.Image", "1.1"),
      video: getLibVersion(zip, deps, "H5P.Video", "1.5"),
      blanks: getLibVersion(zip, deps, "H5P.Blanks", "1.12"),
      dragText: getLibVersion(zip, deps, "H5P.DragText", "1.8")
    };
    
    console.log("Using Libraries:", libs);

    // 5. Generate Content
    // We read the existing content.json only to get basic settings if needed, 
    // but we usually rebuild structure. Ideally, we just use a blank template structure.
    let contentJson: InteractiveBookContent;
    try {
        const existingContent = await zip.file("content/content.json")!.async("string");
        contentJson = JSON.parse(existingContent);
    } catch(e) {
        // Fallback if content.json is missing or corrupt in template
        contentJson = { chapters: [] };
    }

    contentJson.chapters = await Promise.all(
      chaptersData.map(ch => createChapterStructure(ch.title, ch.content, libs))
    );

    // 6. Inject into Zip
    // Wir überschreiben die content.json.
    const contentJsonString = JSON.stringify(contentJson);
    zip.file("content/content.json", contentJsonString);

    // Inject dummy image if needed
    if (contentJsonString.includes("images/missing.jpg")) {
       const dummyImageB64 = "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/yQALCAABAAEBAREA/8wABgAQEAX/2gAIAQEAAD8A0s8g/9k=";
       const binaryString = atob(dummyImageB64);
       const bytes = new Uint8Array(binaryString.length);
       for (let i = 0; i < binaryString.length; i++) {
         bytes[i] = binaryString.charCodeAt(i);
       }
       zip.file("content/images/missing.jpg", bytes);
    }

    // --- MOODLE FIX: THE SURGICAL HACK ---
    // Moodle rejects zip entries that are folders (ending in /) inside 'content'.
    // Standard zip.remove('content/') is recursive and destroys the files inside.
    // Solution: We manually delete the folder ENTRY from the internal JSZip files object.
    // This keeps the files (content.json) alive but removes the folder "wrapper" that Moodle hates.

    // 1. Delete the main content folder entry if it exists
    if (zip.files["content/"]) {
        delete zip.files["content/"];
    }
    
    // 2. Scan for any other folder entries inside content (like "content/images/") and delete them too
    Object.keys(zip.files).forEach(key => {
        // If it starts with content/, ends with /, and is marked as a dir -> Delete the entry key only
        if (key.startsWith("content/") && key.endsWith("/") && zip.files[key].dir) {
            delete zip.files[key];
        }
    });
    // --- END MOODLE FIX ---

    // 7. Save
    const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
    const outputName = markdownFile.name.replace(/\.md$/i, '') + '.h5p';

    if (window.electronAPI) {
      const arrayBuffer = await blob.arrayBuffer();
      await window.electronAPI.saveFile(outputName, arrayBuffer);
    } else {
      const saveAs = (FileSaver as any).saveAs || FileSaver;
      saveAs(blob, outputName);
    }

  } catch (error) {
    console.error("Build Failed:", error);
    throw error;
  }
};