export const copyTextToClipboard = async (text: string) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', 'true');
  textarea.style.position = 'fixed';
  textarea.style.top = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();

  try {
    const succeeded = document.execCommand('copy');
    if (!succeeded) {
      throw new Error('Clipboard write failed');
    }
  } finally {
    document.body.removeChild(textarea);
  }
};

export const readTextFromClipboard = async () => {
  if (!navigator.clipboard?.readText) {
    throw new Error('Clipboard read is not available');
  }

  return navigator.clipboard.readText();
};
