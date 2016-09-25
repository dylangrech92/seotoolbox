<?php
if (!class_exists('GridFieldExportAllAutomatedLinksButton')) {
    class GridFieldExportAllAutomatedLinksButton extends GridFieldExportButton {
        public function generateExportFileData($gridField) {
            $separator = $this->csvSeparator;
            $csvColumns =$gridField->getColumns();
            $fileData = '';
            if($this->csvHasHeader) {
                $headers = array();
                foreach($csvColumns as $columnSource => $columnHeader) {
                    $headers[] = (!is_string($columnHeader) && is_callable($columnHeader)) ? $columnSource : $columnHeader;
                }
                $fileData .= "\"" . implode("\"{$separator}\"", array_values($headers)) . "\"";
                $fileData .= "\n";
            }
            $items = $gridField->getList();

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
    }
}
