const model = require('./score_model');

const fields = {
    ATTR_PROPERTIES : 'properties',
    ATTR_TITLE : 'title',
    ATTR_SPREADSHEET_ID : 'spreadsheetId',
    ATTR_SHEETS : 'sheets',
    CROP_SHEET_SUFFIX : 'Scores',
    FACTOR_REF_SHEET : 'Reference Table'
}

exports.transformSpreadsheetDoc = function(data) {
    const builder = new model.SheetInfoBuilder();

    let sId = data[fields.ATTR_SPREADSHEET_ID];
    let title = null;
    if (fields.ATTR_PROPERTIES in data) {
        title = data[fields.ATTR_PROPERTIES][fields.ATTR_TITLE];
    }

    builder.setInfo(title, sId);

    if (fields.ATTR_SHEETS in data) {
        for (let sheet of data[fields.ATTR_SHEETS]) {
            let sheetTitle = sheet[fields.ATTR_PROPERTIES][fields.ATTR_TITLE];
            let pivot = sheetTitle.lastIndexOf(' ');
            let crop = sheetTitle.substring(0, pivot);
            let type = sheetTitle.substring(pivot + 1, sheetTitle.length);
            
            if (type === fields.CROP_SHEET_SUFFIX) {
                builder.addCrop(crop, sheetTitle);
            } else if (sheetTitle === fields.FACTOR_REF_SHEET) {
                builder.setReference(sheetTitle);
            }
        }
    }

    return builder.get();
}