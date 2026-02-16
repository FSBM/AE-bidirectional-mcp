(function () {
    var items = [];
    for (var i = 1; i <= app.project.numItems; i++) {
        var item = app.project.item(i);
        items.push({
            id: item.id,
            name: item.name,
            type: (item instanceof CompItem) ? "Comp" : ((item instanceof FootageItem) ? "Footage" : "Folder"),
            width: item.width,
            height: item.height
        });
    }
    return JSON.stringify({
        status: "success",
        items: items
    });
})();
