// ==UserScript==
// @name         Copy JIRA Sprint to clipboard
// @namespace    http://tampermonkey.net/
// @version      0.1.1
// @description  Copy JIRA sprint issues to the clipboard (as HTML)
// @author       jfatta
// @match        https://azurecom.atlassian.net/secure/RapidBoard.jspa*
// @grant        GM_setClipboard
// ==/UserScript==

(function() {
    'use strict';

    function registerControls() {
        if ($(".copyIssueToClipboard").length === 0) {
            // Add copy to clipboard control:
            $(".ghx-sprint-edit").after("<a title='Copy sprint issues to the clipboard' class='copyIssueToClipboard aui-icon aui-icon-small aui-iconfont-copy-clipboard edit-labels' style='display:none'/>");
            $(".copyIssueToClipboard").on("click", function(e) {
                e.stopPropagation();
                copySprintIssuesToClipboard($(this).parents(".ghx-backlog-container").find(".ghx-issues"));
            });

            $(".ghx-backlog-header" ).hover(
                function() {
                    $(this).find(".copyIssueToClipboard").show();
                }, function() {
                     $(this).find(".copyIssueToClipboard").hide();
                }
            );

            console.log('TM-CB: copy to clipboard button added');
        }
    }

    function copySprintIssuesToClipboard($issues){
        var content = "";

        $issues.find(".js-issue").each(function(i){
            console.log(i + " :" + $(this).text());
            content +=
                "<p>" +
                resolveIssueStatus($(this)) +
                "<span>" + $(this).find(".ghx-summary .ghx-inner").text() + "</span>"+
                " <span>[<a href='https://azurecom.atlassian.net/browse/"+ $(this).data("issue-key") + "'>"+ $(this).data("issue-key") +"</a>]" +
                "</p>";
        });

        GM_setClipboard("<p>"+content+"</p>", "html");
    }

    function resolveIssueStatus($issue) {
        var issueColor = $issue.find(".ghx-grabber").css("background-color");
        switch(issueColor) {
            case "rgb(46, 194, 96)": // green
            case "rgb(0, 153, 0)": // green devops
            case "rgb(64, 130, 230)": // in code review on devops is done
                return "<b><span style='color:#00B050'>[completed] </span></b>";
            case "rgb(255, 153, 51)": // orange
            case "rgb(31, 141, 219)": // "blue" means in code review
            case "rgb(247, 197, 96)": //devops in progress
                return "<b><span style='color:#ED7D31'>[in progress] </span></b>";
            case "rgb(255, 20, 32)": // "red" (flagged)
            case "rgb(204, 0, 0)": // devops red
                return "<b><span style='color:red'>[blocked] </span></b>";
            default:
                return "<b><span style='color:black'>[pending] </span></b>";
        }
    }

    registerControls();
})();
