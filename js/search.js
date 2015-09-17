
var SEARCH_METHOD = "jp.mixi.application.search.getKeyword";
var AREA = "chrome_extension";

var params_for = function(device, searchText){
    return {
        offset: 0,
        limit: 1,
        device: device,
        area: AREA,
        keyword: searchText
    }
};

var search = function(searchText, callback){
    $.jsonRPC.setup({
        endPoint: 'http://mixi.jp/system/rpc.json',
    }); 

    $.jsonRPC.batchRequest([
        {
            method: SEARCH_METHOD,
            params: params_for("pc", searchText),
        },
        {
            method: SEARCH_METHOD,
            params: params_for("touch", searchText),
        },
        {
            method: SEARCH_METHOD,
            params: params_for("mobile", searchText),
        }
    ],{
        success: function(result) {
            var nested =  result.map(function(current, index, array){
                return current.result.content;
            });
            var resultArray = Array.prototype.concat.apply([], nested);
            console.log(resultArray);
            if(resultArray.length > 0 ){
                callback("success", resultArray[0]);
            } else {
                callback("error", 'not found');
            }
        },
        error: function(result) {
            callback("error", result);
        }
    });

};

var openApp = function(stat, data){
    if(stat=="success"){
        chrome.tabs.create({
            url: data.url
        });
    } else {
        alert(JSON.stringify(data));
    }
};

var copyAppId = function(stat, data){
    if(stat=="success"){
        var textArea = document.createElement("textarea");
        textArea.style.cssText = "position:absolute;left:-100%";
        document.body.appendChild(textArea);

        textArea.value = data.id;
        textArea.select();
        document.execCommand("copy");

        document.body.removeChild(textArea);

        alert(data.id+" ("+data.name+") をコピーしました");
    } else {
        alert(JSON.stringify(data));
    }

}

var parent = chrome.contextMenus.create({
    "title": "mixiアプリ",
    contexts: ["selection"],
});
chrome.contextMenus.create({
    title: "検索して開く",
    parentId: parent,
    contexts: ["selection"],
    onclick: function(info, tab) {
        search(info.selectionText, openApp);
    }
});
chrome.contextMenus.create({
    title: "検索してアプリIDをコピー",
    parentId: parent,
    contexts: ["selection"],
    onclick: function(info, tab) {
        search(info.selectionText, copyAppId);
    }
});

