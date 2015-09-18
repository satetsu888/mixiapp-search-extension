
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

var setClipBoard = function(text){

    var textArea = document.createElement("textarea");
    textArea.style.cssText = "position:absolute;left:-100%";
    document.body.appendChild(textArea);
    textArea.value = text;
    textArea.select();

    var result = document.execCommand("copy");
    document.body.removeChild(textArea);

    return result;
}

var getClipBoard = function(){
    var textArea = document.createElement("textarea");
    textArea.style.cssText = "position:absolute;left:-100%";
    document.body.appendChild(textArea);
    textArea.select();

    document.execCommand("paste");
    var result = textArea.value;
    document.body.removeChild(textArea);

    return result;
}


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
        notify(null, stat, JSON.stringify(data));
    }
};

var copyAppId = function(stat, data){
    if(stat=="success"){
        setClipBoard(data.id);
        notify(data.logo, stat, data.id+" ("+data.name+") をコピーしました");
    } else {
        notify(null, stat, JSON.stringify(data));
    }

}

var notify = function(icon, title, message) {
    if(icon==null){
        icon = "http://img.mixi.net/img/basic/favicon.ico";
    }

    chrome.notifications.create(
        {
            "type": "basic",
            "title": title,
            "message": message,
            "iconUrl": icon,
            "isClickable": true
        }
    );

}


var parent = chrome.contextMenus.create({
    "title": "mixiアプリ",
    contexts: ["selection", "page"],
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
chrome.contextMenus.create({
    title: "クリップボードから検索して開く",
    parentId: parent,
    contexts: ["page"],
    onclick: function(info, tab) {
        search(getClipBoard(), openApp);
    }
});
chrome.contextMenus.create({
    title: "クリップボードから検索してアプリIDをコピー",
    parentId: parent,
    contexts: ["page"],
    onclick: function(info, tab) {
        search(getClipBoard(), copyAppId);
    }
});

