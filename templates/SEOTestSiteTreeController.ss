<!DOCTYPE html>
<html>
	<head>
		<title>SEO Toolbox Analysis</title>
		<meta name="robots" content="noindex">
        <base href="/" target="_blank">
	</head>
	
	<body>
        <div id="wrapper">
            <div class="container container-default" id="init-popup">
                <div class="header text-center">
                    <h1>SEO Toolbox Site Analysis</h1>
                    <p class="text-primary">Test your site for potential SEO problems</p>
                </div>
                <p>&nbsp;</p>
                <div class="col-sm-12 col-md-12 bg-dark popup-settings">
                    <div class="col-sm-4 col-md-4 col-md-offset-4" id="init-form" style="display:none">
                        <div class="form-group">
                            <label for="user-agent" class="text-white">Select User-Agent:</label>
                            <select class="form-control" id="user-agent">
                                <option value="desktop" selected="selected">Desktop</option>
                                <option value="mobile">Mobile</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="robots-url" class="text-white">Robots URL</label>
                            <input type="text" name="robots-url" id="robots-url" value="robots.txt" class="form-control" />
                        </div>
                        <div class="form-group">
                            <label for="sitemap-url" class="text-white">Sitemap URL</label>
                            <input type="text" name="sitemap-url" id="sitemap-url" value="sitemap.xml" class="form-control" />
                        </div>
                        <div class="form-group text-right">
                            <button class="btn text-large btn-success" type="button" id="init-crawler-btn">
                                <span class="glyphicon glyphicon-play">&nbsp;</span>START
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="legend-toggle text-white text-left legend-btn" style="display:none">
                LEGEND
            </div>
            <div id="legend" style="display:none">
                <div class="header">
                    <h2 class="bg-dark text-center">Legend</h2>
                </div>
                <div class="item red text-white text-left">
                    <span class="glyphicon glyphicon-exclamation-sign">&nbsp;</span>URGENT ISSUE
                </div>
                <div class="item yellow text-white text-left">
                    <span class="glyphicon glyphicon-warning-sign">&nbsp;</span>WARNING
                </div>
                <div class="item blue text-white text-left">
                    <span class="glyphicon glyphicon-info-sign">&nbsp;</span>INFORMATION
                </div>
                <div class="item green text-white text-left">
                    <span class="glyphicon glyphicon-ok">&nbsp;</span>SUCCESS
                </div>
                <div class="item purple text-white text-left">
                    <span class="glyphicon glyphicon-hourglass">&nbsp;</span>LOADING
                </div>
                <div class="legend-toggle text-white text-right">
                    <span class="glyphicon glyphicon-arrow-left">&nbsp;</span>
                </div>
            </div>
            <div class="wrapper container-default container-fluid" id="results_container" style="display:none">
                <div class="header main-header">
                    <h1 class="text-center">SEO Toolbox Site Analysis</h1>
                    <div class="stats">
                        <table class="table bg-dark">
                            <thead>
                                <tr>
                                    <th>Pages to analyze</th>
                                    <th>Pages analyzed</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td class="text-left" id="leftcount">0</td>
                                    <td class="text-left" id="donecount">0</td>
                                    <td class="text-left" id="analyzestatus">Loading Pages</td>
                                </tr>
                            </tbody>
                        </table>
                        <table class="table bg-dark">
                            <thead>
                                <tr>
                                    <th id="robots-check"><strong>Robots</strong> </th>
                                    <th id="sitemap-check"><strong>Sitemap</strong> </th>
                                </tr>
                            </thead>
                        </table>
                    </div>
                </div>
            </div>
        </div>
	</body>
</html>
