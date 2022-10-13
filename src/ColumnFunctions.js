/*
 * I admit that this is a bit of a hack involving some DOM tricks...
 * However, it's performance is more than good enough for
 * virtualized tables (less than 100ms for a fullscreen grid).
 * Credit for this method of finding the desired column width via element insert:
 * https://github.com/mui/mui-x/issues/1241
 * And Credit here for the canvas method:
 * https://stackoverflow.com/questions/118241/calculate-text-width-with-javascript/5047712#5047712
 *
 * Both methods appear to have more-or-less identical performance on average
 */
const getAllCellsInAColumn = (gridId, colIndex) =>
  document.querySelectorAll(
    `[aria-label="${gridId}"] [aria-colindex="${colIndex + 1}"]`
  );

function getTextWidth(text, font) {
  // re-use canvas object for better performance
  const canvas =
    getTextWidth.canvas ||
    (getTextWidth.canvas = document.createElement("canvas"));
  const context = canvas.getContext("2d");
  context.font = font;
  const metrics = context.measureText(text);
  return metrics.width;
}

function getCssStyle(element, prop) {
  return window.getComputedStyle(element, null).getPropertyValue(prop);
}

function getCanvasFont(el = document.body) {
  const fontWeight = getCssStyle(el, "font-weight") || "normal";
  const fontSize = getCssStyle(el, "font-size") || "16px";
  const fontFamily = getCssStyle(el, "font-family") || "Times New Roman";
  return `${fontWeight} ${fontSize} ${fontFamily}`;
}

function getMaxColWidthWithCanvas(gridId, colIndex) {
  // No columns smaller than 50px allowed
  const MIN_WIDTH = 50;
  const MUI_WIDTH_BUFFER = 25;
  let width = MIN_WIDTH;
  getAllCellsInAColumn(gridId, colIndex).forEach((cell) => {
    const newWidth = getTextWidth(cell.textContent, getCanvasFont(cell));
    width = Math.max(width, newWidth);
  });
  return Math.ceil(width) + MUI_WIDTH_BUFFER;
}

function getMaxWidthOfCol(gridId, colIndex) {
  // No columns smaller than 50px allowed
  const MIN_WIDTH = 50;
  // The extra 32 is needed to prevent MUI from adding the "..."
  const MUI_WIDTH_BUFFER = 33;

  // Pixels needed to render a certain number of characters is hard to calculate.
  // Instead, create an invisible element, insert the HTML of the cell, and then
  // return the rendered size
  let invisibleContainer = document.createElement("div");

  invisibleContainer.style.visibility = "hidden";
  invisibleContainer.style.zIndex = "-99999";
  invisibleContainer.style.position = "absolute";
  invisibleContainer.style.fontSize = "14px";
  invisibleContainer.style.top = "0";
  invisibleContainer.style.left = "0";

  document.body.append(invisibleContainer);

  const widths = [];

  getAllCellsInAColumn(gridId, colIndex).forEach((cell) => {
    let invisibleCell = document.createElement("div");
    invisibleCell.innerHTML = cell.innerHTML;
    invisibleCell.style.width = "max-content";
    invisibleCell.style.maxWidth = "none";
    invisibleCell.style.minWidth = "none";

    invisibleContainer.append(invisibleCell);

    widths.push(Math.ceil(invisibleCell.clientWidth));
  });

  let max = Math.max(...widths) + MUI_WIDTH_BUFFER;

  if (max < MIN_WIDTH) max = MIN_WIDTH;

  invisibleContainer.remove();

  return max;
}

export { getMaxColWidthWithCanvas, getMaxWidthOfCol };
