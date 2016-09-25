<?php 
if (!class_exists('GridFieldExportAllAutomatedLinksButton')) {
	class GridFieldExportAllAutomatedLinksButton extends GridFieldExportButton {
/** 
* Generate export fields for CSV. 
* 
* @param GridField $gridField 
* @return array 
* 
* ---------- 
* replaces definition in GridFieldExportButton 
* same as original except sources data from $gridField->getList() instead of $gridField->getManipulatedList(); 
* ---------- 
* 
*/ 
public function generateExportFileData($gridField) { 
	$separator = $this->csvSeparator; 
	$csvColumns =$gridField->getColumns();
	$fileData = ''; 
	$columnData = array(); 
	$fieldItems = new ArrayList();
	if($this->csvHasHeader) {
		$headers = array();
// determine the CSV headers. If a field is callable (e.g. anonymous function) then use the 
// source name as the header instead 
		foreach($csvColumns as $columnSource => $columnHeader) {
			$headers[] = (!is_string($columnHeader) && is_callable($columnHeader)) ? $columnSource : $columnHeader; 
		}
		$fileData .= "\"" . implode("\"{$separator}\"", array_values($headers)) . "\""; 
		$fileData .= "\n";
	}
// ----------------------- 
//$items = $gridField->getManipulatedList(); 

	$items = $gridField->getList(); 
// -----------------------
// @todo should GridFieldComponents change behaviour based on whether others are available in the config? 
	foreach($gridField->getConfig()->getComponents() as $component){ 
		if($component instanceof GridFieldFilterHeader || $component instanceof GridFieldSortableHeader) { 
			$items = $component->getManipulatedData($gridField, $items); 
		} 
	}
	foreach($items->limit(null) as $item) { 
		$columnData = array();
		foreach($csvColumns as $columnSource => $columnHeader) { 
			$value = ( $item->hasMethod( $columnHeader ) ) ? $item->$columnHeader() : $item->$columnHeader;
			$value = str_replace(array("\r", "\n"), "\n", $value); 
			$columnData[] = '"' . str_replace('"', '\"', $value) . '"'; 
		}
		$fileData .= implode($separator, $columnData); 
		$fileData .= "\n";
		$item->destroy(); 
	}
	return $fileData; 
}
} // end class GridFieldExportAllButton
} 
?>
