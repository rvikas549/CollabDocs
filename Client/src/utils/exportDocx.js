import {
  Document,
  Packer,
  Paragraph,
  HeadingLevel,
  TextRun,
} from 'docx';

import { saveAs } from 'file-saver';

export async function exportToDocx(
  editor,
  title = 'Document'
) {
  if (!editor) return;

  const json = editor.getJSON();

  const paragraphs = [];

  function walk(node) {
    if (!node) return;

    if (
      node.type === 'heading'
    ) {
      const text =
        node.content
          ?.map(
            (c) => c.text || ''
          )
          .join('') || '';

      paragraphs.push(
        new Paragraph({
          heading:
            HeadingLevel.HEADING_1,
          children: [
            new TextRun({
              text,
              bold: true,
            }),
          ],
        })
      );
    }

    if (
      node.type === 'paragraph'
    ) {
      const text =
        node.content
          ?.map(
            (c) => c.text || ''
          )
          .join('') || '';

      if (text.trim()) {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun(
                text
              ),
            ],
          })
        );
      }
    }

    node.content?.forEach(
      walk
    );
  }

  walk(json);

  const doc =
    new Document({
      sections: [
        {
          children:
            paragraphs,
        },
      ],
    });

  const blob =
    await Packer.toBlob(doc);

  saveAs(
    blob,
    `${title}.docx`
  );
}