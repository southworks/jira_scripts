// ==UserScript==
// @name         Copy JIRA Sprint to clipboard
// @namespace    http://tampermonkey.net/
// @version      0.1.5
// @description  Copy JIRA sprint issues to the clipboard (as HTML)
// @author       jfatta, litodam
// @match        https://azurecom.atlassian.net/secure/RapidBoard.jspa*
// @grant        GM_setClipboard
// ==/UserScript==

(function() {
    'use strict';

    function registerControls() {
        // retrieve all sprints
        var sprints = $("div[data-sprint-id]");

        sprints.each(function(index, value) {
            var sprint = $(value);

            if (sprint.find(".copyIssueToClipboard").length === 0) {
                // Add copy to clipboard control:
                sprint.find('.header-left').append("<a title='Copy sprint issues to the clipboard' class='copyIssueToClipboard aui-icon aui-icon-small aui-iconfont-copy-clipboard edit-labels' style='display:none'/>");
                sprint.find(".copyIssueToClipboard").on("click", function(e) {
                    e.stopPropagation();
                    var backlog = $(this).parents(".ghx-backlog-container"),
                        sprintTitle = backlog.find('.ghx-name').text(),
                        boardLink = getBoardLink();

                    copySprintIssuesToClipboard(backlog.find(".ghx-issues"), sprintTitle, boardLink);
                });

                sprint.find(".ghx-backlog-header" ).hover(
                    function() {
                        $(this).find(".copyIssueToClipboard").show();
                    }, function() {
                        $(this).find(".copyIssueToClipboard").hide();
                    }
                );

                console.log('TM-CB: copy to clipboard button added');
            }
        });
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

            // issue status
            var issueStatus = resolveIssueStatus($issue);
            var isDone = issueStatus.indexOf("completed") !== -1;

            // resolve estimate
            var estimate = $issue.find("span[title='Estimation']").text();
            if (!estimate) {
                estimate = $issue.find("span[title='Original Time Estimate']").text();
            }

            // resolve spent
            var spentElement = $issue.find("span.ghx-extra-field[data-tooltip*='Time Spent']");
            var spent = spentElement.text();
            if (spent && spent === "None") {
                spent = "";
            }

            var spentText = spent.length === 0 ? "" : ", spent: " + spent;

            // resolve remaining
            var remaining = $issue.find("span.ghx-extra-field[data-tooltip*='Remaining Estimate']").text();
            if (remaining && remaining === "None") {
                remaining = "0";
            }

            var remainingText = isDone ? "" : ", remaining: " + remaining;

            // (estimated 4h, remaining 2h, logged 2h)
            content +=
                "<li><p>" +
                resolveIssueStatus($issue) +
                "<span>" + $issue.find(".ghx-summary .ghx-inner").text() + "</span>"+
                " <span>[<a href='https://azurecom.atlassian.net/browse/"+ $issue.data("issue-key") + "'>"+ $issue.data("issue-key") +"</a>]</span>" +
                "<span><i> (estimated: " + estimate + spentText + remainingText + ")</i></span>" +
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
            case "rgb(64, 130, 230)": // in code review devops
            case "rgb(31, 141, 219)": // "blue" means in code review
                return "<b><span style='color:#00B050'>[completed] </span></b>";

            case "rgb(45, 73, 237)": //supcom in code review
                return "<b><span style='color:#00B050'>[code review] </span></b>";

            case "rgb(255, 153, 51)": // orange
            case "rgb(247, 197, 96)": // devops in progress
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

    // register global ajax handler
    $(document).ajaxSuccess(function() {
        registerControls();
    });

    registerControls();
    
})();
