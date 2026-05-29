import mammoth from 'mammoth';

export async function importDocx(
  file,
  editor
) {
  if (!file || !editor) return;

  try {
    const arrayBuffer =
      await file.arrayBuffer();

    const result =
      await mammoth.convertToHtml({
        arrayBuffer,
      });

    const html = result.value;

    // Insert into editor
    editor.commands.setContent(
      html
    );

    console.log(
      'DOCX imported successfully'
    );
  } catch (err) {
    console.error(
      'Import failed:',
      err
    );
  }
}