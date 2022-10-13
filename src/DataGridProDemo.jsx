import * as React from "react";
import Box from "@mui/material/Box";
import { DataGridPro, useGridApiRef } from "@mui/x-data-grid-pro";
import { useDemoData } from "@mui/x-data-grid-generator";
import { getMaxWidthOfCol } from "./ColumnFunctions";
// import { getMaxColWidthWithCanvas } from "./ColumnFunctions";

/**
 * The only drawback to this method is that DataGridPro uses virtualization!
 * That means we can only resize the column for the data currently visible on the screen!
 *
 * However, it still feels very nice/natural to have when using the DataGrid(Pro)
 */
export default function DataGridProDemo() {
  // MUI has a data grid generator function for filling your grid with dummy data
  const { data } = useDemoData({
    dataSet: "Commodity",
    rowLength: 100,
    editable: false,
  });

  // This is how you are able to call column resizing methods on the grid
  // via gridRef.current
  const gridRef = useGridApiRef();

  const defaultDoubleClickState = { doubleClick: false, columnName: "" };
  const [doubleClickState, setDoubleClickState] = React.useState(
    defaultDoubleClickState
  );

  return (
    <Box sx={{ height: 1048, width: "100%" }}>
      <DataGridPro
        apiRef={gridRef}
        rows={data.rows}
        columns={data.columns}
        loading={data.rows.length === 0}
        rowHeight={38}
        disableSelectionOnClick
        onColumnHeaderDoubleClick={(e) => {
          // console.log("onColumnHeaderDoubleClick", e.colDef.headerName);
          // Keep track of which column was double clicked!
          setDoubleClickState({
            doubleClick: true,
            columnName: e.colDef.field,
          });
          /* 
          If this was a double-click on the column-resizer bar, then the onColumnWidthChange
          event will immediately fire. This setTimeout call will be scheduled right after that.
          So, a double-click on the regular column header will never trigger a resize, because,
          by the time anything else happens, we will have already set the "doubleClick" state
          back to false.
          */
          window.setTimeout(() =>
            setDoubleClickState({ defaultResizeState: defaultDoubleClickState })
          );
        }}
        onColumnWidthChange={(e) => {
          // console.log("onColumnWidthChange", e.colDef.headerName);
          if (
            doubleClickState.columnName === e.colDef.field &&
            doubleClickState.doubleClick
          ) {
            // console.time("Column resizing");
            const colIndex = gridRef.current.getColumnIndex(e.colDef.field);

            if (colIndex !== -1) {
              // const newWidth = getMaxColWidthWithCanvas(colIndex);
              const newWidth = getMaxWidthOfCol(colIndex);
              // console.log("RESIZE", {
              //   colIndex,
              //   newWidth,
              //   field: e.colDef.headerName,
              //   e,
              // });

              /* 
              Using setTimeout here prevents an infinite loop because the setColumnWidth
              function will trigger this onColumnWidthChange event handler that we're in
              right now! Using setTimeout ensures that React will have already updated state
              and set the doubleClick boolean to false before resizing the column.
              */
              window.setTimeout(() => {
                gridRef.current.setColumnWidth(e.colDef.field, newWidth);
                // console.timeEnd("Column resizing");
              });
            }
          }
          setDoubleClickState(defaultDoubleClickState);
        }}
        /* 
        A drag-to-resize always ends with an onColumnWidthChange event.
        This could result in a user dragging to resize, mouseup, and then
        quickly mousedown on the same resizer bar triggering an auto-resize
        event, which we don't want!
        Make sure we don't have doubleClick = true in state if the user
        is dragging to resize a column.
        */
        onColumnResize={() => setDoubleClickState(defaultDoubleClickState)}
      />
    </Box>
  );
}
