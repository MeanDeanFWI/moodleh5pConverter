Hier ist der gesamte Inhalt als ein einziger, sauberer Markdown-Codeblock. Du kannst ihn direkt kopieren und in eine Datei namens `README.md` oder `GUIDE.md` einfügen.

# 📘 H5P Builder: Markdown-Syntax-Handbuch

**Schluss mit der Klick-Orgie.**
Mit dem **H5P Builder** erstellen Sie vollständige *H5P Interactive Books*, indem Sie einfach eine Textdatei schreiben. Anstatt sich durch verschachtelte Menüs in H5P zu klicken, formatieren Sie Ihren Inhalt effizient mit Markdown und speziellen "Tags".

---

## 📑 Inhaltsverzeichnis

1.  [Grundstruktur & Kapitel](#1-grundstruktur--kapitel)
2.  [Einfacher Text](#2-einfacher-text)
3.  [Akkordeons (Ausklappbare Bereiche)](#3-akkordeons)
4.  [Quiz (Single Choice)](#4-quiz-single-choice)
5.  [Lückentext (Fill in the Blanks)](#5-lückentext)
6.  [Drag the Words (Wörter zuordnen)](#6-drag-the-words)
7.  [Bilder & Videos](#7-bilder--videos)
8.  [Komplettes Beispiel](#8-beispiel-für-eine-komplette-datei)

---

## 1. Grundstruktur & Kapitel

Das Interactive Book wird automatisch in Seiten (Kapitel) unterteilt. Um eine neue Seite zu beginnen, verwenden Sie einfach eine **Überschrift 1**.

**Syntax:** Ein `#` gefolgt von einem Leerzeichen und dem Titel.

```
# Einleitung
Hier steht der Text für die erste Seite.

# Kapitel 1: Grundlagen
Hier beginnt automatisch eine neue Seite im Buch.
```

-----

## 2\. Einfacher Text 📝

Zwischen den interaktiven Elementen können Sie ganz normalen Text schreiben. Die gängige Markdown-Formatierung wird unterstützt.

| Stil | Syntax | Ergebnis |
| :--- | :--- | :--- |
| **Fett** | `**Wort**` | **Wort** |
| *Kursiv* | `*Wort*` | *Wort* |
| **Liste** | `- Punkt A` | • Punkt A |
| **Nummerierte Liste** | `1. Punkt A` | 1. Punkt A |

-----

## 3\. Akkordeons 🔽

Erstellt eine Liste von ausklappbaren Bereichen. Ideal, um große Textmengen zu strukturieren oder für FAQs.

**Die Regeln:**

  * Der Tag `[ACCORDION]` muss allein in einer Zeile stehen.
  * Jedes Panel beginnt mit drei Pluszeichen `+++` gefolgt vom Titel.

<!-- end list -->

```markdown
[ACCORDION]
+++ Was ist H5P?
H5P ist eine freie Software für interaktive Inhalte.

+++ Wie nutze ich es?
Sie können es in Moodle, WordPress oder Drupal integrieren.
```

-----

## 4\. Quiz (Single Choice) ❓

Erstellt eine Single-Choice-Frage direkt im Textfluss.

**Die Regeln:**

  * Der Tag `[QUIZ]` muss allein in einer Zeile stehen.
  * `?` markiert die Frage.
  * `*` markiert die **richtige** Antwort.
  * `-` markiert falsche Antworten.

> **Hinweis:** Schreiben Sie die richtige Antwort im Markdown immer an erster Stelle (mit `*`). H5P mischt die Antworten für den Lerner später automatisch durch.

```markdown
[QUIZ]
? Was ist die Hauptstadt von Frankreich?
* Paris
- London
- Berlin
- Madrid
```

-----

## 5\. Lückentext ✍️

Erstellt einen Text, in dem Begriffe fehlen, die der Lerner eintippen muss ("Fill in the Blanks").

**Die Regeln:**

  * Der Tag `[FILL]` muss allein in einer Zeile stehen.
  * Markieren Sie das gesuchte Wort mit Sternchen: `*Lösung*`.

<!-- end list -->

```markdown
[FILL]
Der *Himmel* ist blau.
Wasser kocht bei *100* Grad Celsius.
```

-----

## 6\. Drag the Words 🖱️

Ähnlich wie der Lückentext, aber hier müssen die Begriffe per Drag & Drop in den Text gezogen werden. Eignet sich hervorragend für fließende Texte und Definitionen.

**Die Regeln:**

  * Der Tag `[DRAG]` muss allein in einer Zeile stehen.
  * Markieren Sie die ziehbaren Wörter mit Sternchen: `*Wort*`.

<!-- end list -->

```markdown
[DRAG]
Dies ist ein Beispiel für *Drag* the Words.
Der Benutzer muss die markierten *Begriffe* in die richtigen Boxen ziehen.
```

-----

## 7\. Bilder & Videos 🎬

Sie können Platzhalter für Medien erstellen. Da Markdown-Dateien reiner Text sind, werden "Slots" angelegt, die Sie später in Lumi/H5P mit den echten Dateien befüllen.

### Bilder 🖼️

Verwenden Sie die Standard-Markdown-Syntax. Der Link in der Klammer wird ignoriert, erzeugt aber den Upload-Container.

```markdown
![Beschreibung des Bildes](platzhalter.jpg)
```

### Videos 🎥

Erstellt einen leeren Video-Player-Block.

```markdown
[VIDEO]
```

-----

## 8\. Beispiel für eine komplette Datei

Hier sehen Sie, wie alles zusammenwirkt. Kopieren Sie dies in eine `.md` Datei, um es zu testen.

```markdown
# Willkommen im Kurs

In diesem Kapitel lernen wir die Grundlagen.

[ACCORDION]
+++ Lernziele
1. Verstehen der Syntax
2. Anwenden der Tags

[VIDEO]

# Überprüfung des Wissens

Testen wir, was hängengeblieben ist.

[QUIZ]
? Welches Zeichen markiert die richtige Antwort?
* Sternchen (*)
- Plus (+)
- Fragezeichen (?)

[FILL]
Markdown ist eine vereinfachte *Auszeichnungssprache*.
```

```
```

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
