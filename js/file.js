/**
 * Download client-side text as file
 * @param {string} text     Text to download in file
 * @param {string} name     What should we name the file?
 */
export const downloadTextFile = (text, name, mime = 'text/plain') => {
  let data = new Blob([text], { type: mime });
  let url = window.URL.createObjectURL(data);
  downloadLink(url, name);
};

/**
 * Create <a download></a> link and click it
 * @param {string} href - Link to file to download
 * @param {string} name - Name of file to download
 */
export const downloadLink = (href, name) => {
  const a = document.createElement('a');
  a.href = href;
  a.setAttribute('download', name);
  a.click();
  a.remove();
};

export const readFile = async file => {
  return new Promise((resolve, reject) => {
    let freader = new FileReader();
    freader.onload = () => resolve(freader.result);
    freader.onerror = reject;
    freader.readAsBinaryString(file);
  })
};

export const readFileFromInput = async finput => {
  let file = finput.files[0];
  if (file) {
    return await readFile(file);
  } else {
    return null;
  }
};