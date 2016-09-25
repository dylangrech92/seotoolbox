<?php
if (!class_exists('GridFieldPrintAllAutomatedLinksButton')) {
    class GridFieldPrintAllAutomatedLinksButton extends GridFieldPrintButton {
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

            $items = $gridField->getList();
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
    }
}
