<?php

class SEOToolboxAnalyzerField extends LiteralField{

    public function __construct($name, $isMobile, $url){
        $content = $this->createBaseHTML($name, $isMobile, $url);
        parent::__construct($name, $content);
    }

    private function createBaseHTML($name, $mobile, $url){
        $title  = ($mobile) ? 'Mobile' : 'Desktop';
        $mobile_toggle = ($mobile) ? 'true' : 'false';
        $div    = "<div id='seotoolbox_con_{$name}'><h3>{$title}</h3><div class='result_cont'></div></div>";
        $script = "<script type='text/javascript'>
                    (function(\$){new PageAnalyzer(\$('#seotoolbox_con_{$name} .result_cont'),'{$url}',{$mobile_toggle})}(jQuery))
                   </script>";
        return $div.$script;
    }
}
