// ==UserScript==
// @name         Copy JIRA Sprint to clipboard
// @namespace    http://tampermonkey.net/
// @version      0.1.4
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
            $('.header-left').append("<a title='Copy sprint issues to the clipboard' class='copyIssueToClipboard aui-icon aui-icon-small aui-iconfont-copy-clipboard edit-labels' style='display:none'/>");
            $(".copyIssueToClipboard").on("click", function(e) {
                e.stopPropagation();
                var backlog = $(this).parents(".ghx-backlog-container"),
                    sprintTitle = backlog.find('.ghx-name').text(),
                    boardLink = getBoardLink();
                copySprintIssuesToClipboard(backlog.find(".ghx-issues"), sprintTitle, boardLink);
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

    function getBoardLink()
    {
        // Note: different boards can have different selectors, feel free to add as required
        var boardLinkSelectors = [
            '#com\\.pyxis\\.greenhopper\\.jira\\:user-container-sidebar-work-scrum a', // Devops
            '#com\\.pyxis\\.greenhopper\\.jira\\:project-sidebar-work-scrum a' // SUPCOM
        ];

        for(var c = 0; c <= boardLinkSelectors.length; c++)
        {
            var link = $(boardLinkSelectors[c]).attr('href');
            if (link !== undefined)
            {
                return 'https://' + location.host + link;
            }
        }
    }

    function copySprintIssuesToClipboard($issues, sprintTitle, boardLink){
        var content = "<ol>";

        $issues.find(".js-issue").not('.ghx-filtered').each(function(i){
            var $issue = $(this);
            console.log(i + " :" + $issue.text());

            var spent = $($issue.find(".ghx-extra-field")[0]).text().replace("h", ""), // First look for the time spent
                spentText = "";

            if (spent.toLowerCase() === "none")
            {
                spent = "0";
            }

            var estimate = $issue.find("span.aui-badge").text().replace("h", "");

            content +=
                "<li><p>" +
                resolveIssueStatus($issue) +
                "<span>" + $issue.find(".ghx-summary .ghx-inner").text() + "</span>"+
                " <span>[<a href='https://azurecom.atlassian.net/browse/"+ $issue.data("issue-key") + "'>"+ $issue.data("issue-key") +"</a>]</span>" +
                "<span><i> - (Spent: " + spent + " hs / Estimate: " + estimate + " hs)</i></span>" +
                "</p></li>";
        });

        content += '</ol>';

        GM_setClipboard("<p style='color:#2e75b5;font-family:Calibri;font-size:14pt'>Iteration Goals - Sprint " + sprintTitle + "</p><p></p><a href='" + boardLink + "'>" + boardLink + "</a><p>" + content + "</p>", "html");
    }

    function resolveIssueStatus($issue) {
        var issueColor = $issue.find(".ghx-grabber").css("background-color");
        switch(issueColor) {
            case "rgb(46, 194, 96)": // green
            case "rgb(0, 153, 0)": // green devops
            case "rgb(64, 130, 230)": // in code review on devops is done
                return "<b><span style='color:#00B050'>[completed] </span></b>";
            case "rgb(45, 73, 237)": //supcom in code review
                return "<b><span style='color:#00B050'>[code review] </span></b>";
            case "rgb(255, 153, 51)": // orange
            case "rgb(31, 141, 219)": // "blue" means in code review
            case "rgb(247, 197, 96)": //devops in progress
            case "rgb(237, 174, 57)": // supcom in progress
                return "<b><span style='color:#ED7D31'>[in progress] </span></b>";
            case "rgb(255, 20, 32)": // "red" (flagged)
            case "rgb(204, 0, 0)": // devops red
            case "rgb(242, 29, 29)" : // supcom blocked
                return "<b><span style='color:red'>[blocked] </span></b>";
            default:
                return "<b><span style='color:black'>[pending] </span></b>";
        }
    }

    registerControls();
})();
