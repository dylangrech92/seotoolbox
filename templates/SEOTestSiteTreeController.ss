<!DOCTYPE html>
<html>
	<head>
		<title>SEO Toolbox Analysis</title>
		<meta name="robots" content="noindex">
        <base href="/" target="_blank">
	</head>
	
	<body>
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
                    <div class="form-group text-right">
                        <button class="btn text-large btn-success" type="button" id="init-crawler-btn">
                            <span class="glyphicon glyphicon-play">&nbsp;</span>START
                        </button>
                    </div>
                </div>
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
				</div>
			</div>
		</div>
	</body>
</html>
