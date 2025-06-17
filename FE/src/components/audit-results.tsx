"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle,
  XCircle,
  FileText,
  TrendingUp,
  AlertTriangle,
  RotateCcw,
  Download,
  AlertCircle, // Make sure AlertCircle is imported if used in destructive Alert
} from "lucide-react";

// Import your backend interfaces directly (adjust path as necessary)
// Assuming these are in: '../../BE/src/models/EvaluationResult.ts'
import type {
  RuleEvaluationResult,
  EmailEvaluation,
  ThreadAuditReport,
} from "../../../BE/src/models/EvaluationResult";

interface AuditResultsProps {
  // We'll pass a single ThreadAuditReport if one audit is performed,
  // or null if no results yet.
  // If you intent to display a list of multiple *different* ThreadAuditReports,
  // then 'results: ThreadAuditReport[]' would be correct, and the component
  // structure would need slight adjustment for the outer map.
  // For now, I'll assume `results` refers to *one* complete thread audit report.
  report: ThreadAuditReport | null;
  onClearResults: () => void;
}

export function AuditResults({ report, onClearResults }: AuditResultsProps) {
  // If no report, render nothing or a placeholder
  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-gray-500">
        <FileText className="h-12 w-12 mb-4" />
        <p className="text-xl">No audit report to display yet.</p>
        <p className="text-md">Upload a JSON file to get started!</p>
      </div>
    );
  }

  // Helper functions remain useful
  const getScoreColor = (score: number) => {
    if (score >= 0.9) return "text-green-600";
    if (score >= 0.75) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 0.9) return "default";
    if (score >= 0.75) return "secondary";
    return "destructive";
  };

  // The average score is directly from the ThreadAuditReport
  const overallAverageScore = report.averageThreadScore;

  // Calculate total passed/failed rules across all emails in the thread
  const totalPassedRules = report.emailEvaluations.reduce(
    (sum, emailEval) =>
      sum + emailEval.results.filter((r) => r.score >= 0.75).length, // Assuming score >= 0.75 is considered 'passed'
    0
  );
  const totalFailedRules = report.emailEvaluations.reduce(
    (sum, emailEval) =>
      sum + emailEval.results.filter((r) => r.score < 0.75).length, // Assuming score < 0.75 is 'failed'
    0
  );
  const totalRules = totalPassedRules + totalFailedRules;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            Audit Results for Thread ID: {report.threadId || "N/A"}
          </h2>
          <p className="text-gray-600">
            Analyzed {report.emailEvaluations.length} email
            {report.emailEvaluations.length !== 1 ? "s" : ""} • Average Score:{" "}
            <span className={getScoreColor(overallAverageScore)}>
              {(overallAverageScore * 100).toFixed(1)}%{" "}
              {/* Convert to percentage */}
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClearResults}>
            <RotateCcw className="h-4 w-4 mr-2" />
            New Audit
          </Button>
          {/* Export Report button - you'd implement the download logic here */}
          <Button
            onClick={() => {
              const dataStr =
                "data:text/json;charset=utf-8," +
                encodeURIComponent(JSON.stringify(report, null, 2));
              const downloadAnchorNode = document.createElement("a");
              downloadAnchorNode.setAttribute("href", dataStr);
              downloadAnchorNode.setAttribute(
                "download",
                `thread_audit_report_${report.threadId || "unknown"}.json`
              );
              document.body.appendChild(downloadAnchorNode);
              downloadAnchorNode.click();
              downloadAnchorNode.remove();
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Overall Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Overall Thread Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {report.emailEvaluations.length}
              </div>
              <div className="text-sm text-gray-600">Emails in Thread</div>
            </div>
            <div className="text-center">
              <div
                className={`text-2xl font-bold ${getScoreColor(
                  overallAverageScore
                )}`}
              >
                {(overallAverageScore * 100).toFixed(1)}%{" "}
                {/* Convert to percentage */}
              </div>
              <div className="text-sm text-gray-600">Average Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {totalPassedRules}
              </div>
              <div className="text-sm text-gray-600">Total Rules Passed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {totalFailedRules}
              </div>
              <div className="text-sm text-gray-600">Total Rules Failed</div>
            </div>
          </div>
          <Separator className="my-6" />
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2 flex items-center text-green-700">
                <CheckCircle className="h-4 w-4 mr-2" />
                Overall Strengths
              </h3>
              <p className="text-gray-700">{report.overallStrengths}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 flex items-center text-orange-700">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Overall Improvement Areas
              </h3>
              <p className="text-gray-700">{report.overallImprovementAreas}</p>
            </div>
            {report.topSuggestions && report.topSuggestions.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 flex items-center text-purple-700">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Top Suggestions for Thread
                </h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  {report.topSuggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Individual Email Evaluations */}
      <h3 className="text-xl font-bold mt-8 mb-4">
        Individual Email Evaluations
      </h3>
      {report.emailEvaluations.map((emailEval) => (
        <Card key={emailEval.messageId}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                <div>
                  <CardTitle className="text-lg">
                    Email ID: {emailEval.messageId || "N/A"}
                  </CardTitle>
                  <CardDescription>
                    Score:{" "}
                    <span className={getScoreColor(emailEval.totalScore)}>
                      {(emailEval.totalScore * 100).toFixed(1)}%{" "}
                      {/* Convert to percentage */}
                    </span>
                  </CardDescription>
                </div>
              </div>
              <Badge
                variant={getScoreBadgeVariant(emailEval.totalScore)}
                className="text-lg px-3 py-1"
              >
                {(emailEval.totalScore * 100).toFixed(1)}%{" "}
                {/* Convert to percentage */}
              </Badge>
            </div>
            <Progress value={emailEval.totalScore * 100} className="mt-2" />{" "}
            {/* Progress expects 0-100 */}
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Rule Results for this email */}
            <div>
              <h4 className="font-semibold mb-3">
                Rule Analysis for this Email
              </h4>
              <div className="space-y-3">
                {emailEval.results.map((rule, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="mt-0.5">
                      {rule.score >= 0.75 ? ( // Assuming a score of 0.75 or higher means 'passed'
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h5 className="font-medium">{rule.ruleName}</h5>
                        <Badge
                          variant={
                            rule.score >= 0.75 ? "default" : "destructive"
                          }
                        >
                          {(rule.score * 100).toFixed(1)}%{" "}
                          {/* Convert to percentage */}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {rule.justification}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Email-Specific Suggestions */}
            {emailEval.suggestions && emailEval.suggestions.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 flex items-center text-purple-700">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Suggestions for this Email
                </h4>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  {emailEval.suggestions.map((suggestion, index) => (
                    <li key={index} className="text-sm">
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
