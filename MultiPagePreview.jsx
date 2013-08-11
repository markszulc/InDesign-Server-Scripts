//==============================================================================
// Generate high quality jpeg previews for each page and one PDF
// Send back to CQ as renditions Page1, Page2...
//==============================================================================

//==== get soap arguments ====
if (app.scriptArgs.isDefined("credentials")) {
    var credentials = app.scriptArgs.getValue("credentials");
} else {
    throw "CQ host credentials argument is missing";
}
if (app.scriptArgs.isDefined("cqHost")) { 
    var host = app.scriptArgs.getValue("cqHost");
} else {
    throw "cqHost argument is missing";
}
if (app.scriptArgs.isDefined("resource")) { 
    var resourcePath = app.scriptArgs.getValue("resource");
} else {
    throw "resource argument is missing";
}


try {
    //==== create a temporary folder under InDesign server tmp directory to fetch and export ====
    var exportFolder = new Folder();
    exportFolder.create();
    fileName = resourcePath.substring (resourcePath.lastIndexOf ('/'), resourcePath.lastIndexOf ('.'));
    var sourceFile = new File(exportFolder.fullName + fileName + '.indd');
    // Image previews
    var outputFile = new File(exportFolder.fullName + '/PreviewPage.png');

    app.consoleout('Fetching resource from CQ: '+resourcePath);
    fetchResource (host,  credentials, resourcePath, sourceFile);

    var document = app.open(sourceFile);

    with (app.jpegExportPreferences) {
        exportResolution = 300;
        viewDocumentAfterExport = false;
    }
    document.exportFile(ExportFormat.PNG_FORMAT, outputFile);

    // close the document
    document.close(SaveOptions.no);
    

    //==== send file to CQ ====
    var target = resourcePath.substring (0, resourcePath.lastIndexOf ('/')) + "/renditions";
    app.consoleout('Posting Page Previews to: ' +target);
    
    //==== get all previews and post to CQ. Adapt first page name to Page1 before posting ====
    postAllPages(exportFolder, target);

    
     //==== remove the original resource and the exported file ====
    sourceFile.remove();

    returnValue = "Thumbnail created and posted successfully";
} finally {
    //==== remove the temp folder ====
    cleanup(exportFolder);
}


function postAllPages(folder, target) {
    var files = folder.getFiles();
    for (index in files) {
        if (files[index].name.substring(0, 11) == "PreviewPage") {
            //send it
            var file = new File(files[index].fullName);
            var fileName = file.name;
            // quick fix to set first preview name as PreviewPage1
            if (fileName == "PreviewPage.png") {
                fileName = "PreviewPage1.png";
            }
            app.consoleout('Sending page preview: ' +file.fullName);
            putResource (host, credentials,  file, fileName, 'image/png', target);
        }
    }
}


app.consoleout('Page Previews created and posted successfully...');

