<?php

class SEOToolboxAnalyzerField extends LiteralField {

    public function __construct($name, $url) {
        $content = $this->createBaseHTML($name, $url);
        parent::__construct($name, $content);
    }

    /**
     * Create the html needed to represent this form field
     *
     * @param $name
     * @param $url
     * @return string
     */
    private function createBaseHTML($name, $url) {
        $div    = "<div id='seotoolbox_con_{$name}'><div class='clearfix result_cont'></div></div>";
        $script = "<script type='text/javascript'>
                    new PageAnalyzer(jQuery('#seotoolbox_con_{$name} .result_cont'),'{$url}');
                   </script>";
        return $div.$script;
    }
}
