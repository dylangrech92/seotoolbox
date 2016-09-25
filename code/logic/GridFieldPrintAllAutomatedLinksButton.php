<?php 
if (!class_exists('GridFieldPrintAllAutomatedLinksButton')) {
    class GridFieldPrintAllAutomatedLinksButton extends GridFieldPrintButton {
/** 
* Export core. 
* 
* @param GridField 
* 
* ---------- 
* replaces definition in GridFieldPrintButton 
* same as original except sources data from $gridField->getList() instead of $gridField->getManipulatedList(); 
* ---------- 
* 
*/ 
public function generatePrintData(GridField $gridField) { 
    $printColumns = $this->getPrintColumnsForGridField($gridField);
    $header = null;
    if($this->printHasHeader) { 
        $header = new ArrayList();
        foreach($printColumns as $field => $label){ 
            $header->push(new ArrayData(array( 
                "CellString" => $label, 
                ))); 
        } 
    }
// ----------------------- 
//$items = $gridField->getManipulatedList(); 
    $items = $gridField->getList(); 
// -----------------------
    $itemRows = new ArrayList();
    foreach($items as $item) { 
        $itemRow = new ArrayList();
        foreach($printColumns as $field => $label) { 
            $value = $gridField->getDataFieldValue($item, $field);
            $itemRow->push(new ArrayData(array( 
                "CellString" => $value, 
                ))); 
        }
        $itemRows->push(new ArrayData(array( 
            "ItemRow" => $itemRow 
            )));
        $item->destroy(); 
    }
    $ret = new ArrayData(array( 
        "Title" => $this->getTitle($gridField), 
        "Header" => $header, 
        "ItemRows" => $itemRows, 
        "Datetime" => SS_Datetime::now(), 
        "Member" => Member::currentUser(), 
        ));
    return $ret;
} 
} // end class GridFieldPrintAllButton
}
?>
