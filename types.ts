

export interface H5PMetadata {
  license: string;
  title: string;
  authors?: any[];
  changes?: any[];
  extraTitle?: string;
  contentType?: string; // Optional field seen in some editors
}

export interface AdvancedTextParams {
  text: string; // HTML string
}

// --- ACCORDION INTERFACES ---

export interface AccordionPanel {
  title: string;
  content: H5PContentObject; // Usually H5P.AdvancedText
}

export interface AccordionParams {
  panels: AccordionPanel[];
  hTag: string; // e.g. "h2"
}

// --- SINGLE CHOICE SET INTERFACES ---

export interface SingleChoice {
  question: string;
  answers: string[]; // First one is correct
  subContentId: string;
}

export interface SingleChoiceSetBehaviour {
  autoContinue: boolean;
  enableRetry: boolean;
  enableSolutionsButton: boolean;
  passPercentage: number;
  [key: string]: any;
}

export interface SingleChoiceSetParams {
  choices: SingleChoice[];
  behaviour: SingleChoiceSetBehaviour;
}

// --- NEW CONTENT TYPES ---

export interface ImageParams {
  alt: string;
  title?: string;
  file: {
    path: string;
    mime: string;
    copyright?: any;
    width?: number;
    height?: number;
  };
  contentName: string;
}

export interface VideoParams {
  sources: any[]; // Empty array for placeholder
  visuals: {
    fit: boolean;
    controls: boolean;
    poster?: any;
  };
  playback?: {
    autoplay: boolean;
    loop: boolean;
  };
}

export interface BlanksParams {
  questions: string[]; // Array of HTML strings containing *asterisks*
  behaviour: {
    enableRetry: boolean;
    enableSolutionsButton: boolean;
    autoRetry: boolean;
    caseSensitive: boolean;
    showSolutionsRequiresInput: boolean;
    separateLines: boolean;
  };
}

export interface DragTextParams {
  textField: string; // Text containing *asterisks*
  taskDescription: string;
  behaviour: {
    enableRetry: boolean;
    enableSolutionsButton: boolean;
    instantFeedback: boolean;
  };
}

// --- GENERIC H5P OBJECTS ---

export interface H5PContentObject {
  library: string;
  params: any;
  subContentId: string;
  metadata: H5PMetadata;
}

// H5P.Column requires its children to be wrapped in an object
export interface ColumnContentWrapper {
  content: H5PContentObject;
  useSeparator: string; // usually "auto"
}

export interface ColumnParams {
  content: ColumnContentWrapper[]; 
}

export interface Chapter extends H5PContentObject {
  library: string;
  params: ColumnParams;
}

export interface InteractiveBookContent {
  chapters: Chapter[];
  [key: string]: any;
}

declare global {
  interface Window {
    electronAPI?: {
      saveFile: (name: string, buffer: ArrayBuffer) => Promise<{ success: boolean; filePath?: string; cancelled?: boolean }>;
    };
  }
}