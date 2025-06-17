import {
  AlertCircle,
  CheckCircle,
  FileText,
  Mail,
  Shield,
  Zap,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./components/ui/card";

import type { ParsedEmail } from "../../BE/src/models/Email";
import { Button } from "./components/ui/button";
import { useState } from "react";
import type {
  RuleEvaluationResult,
  EmailEvaluation,
  ThreadAuditReport,
} from "../../BE/src/models/EvaluationResult";
import { FileUpload } from "./components/file-upload";
import { AuditResults } from "./components/audit-results";

interface ThreadAuditRequest {
  emails: ParsedEmail[];
  employeeEmail?: string; // Optional, but recommended for AI summarization
}

function readFileContent(myFile: File): Promise<any> {
  return new Promise((resolve, reject) => {
    if (!myFile) {
      reject(new Error("No file provided."));
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const fileContent = event.target?.result as string;
        const parsedData = JSON.parse(fileContent);

        console.log("Successfully read and parsed file content:", parsedData);
        resolve(parsedData);
      } catch (error) {
        console.error("Error parsing file content as JSON:", error);
        reject(
          new Error(
            `Failed to parse file as JSON: ${
              error instanceof Error ? error.message : String(error)
            }`
          )
        );
      }
    };
    reader.onerror = (event) => {
      console.error("Error reading file:", event.target?.error);
      reject(
        new Error(
          `Error reading file: ${
            event.target?.error?.message || "Unknown error"
          }`
        )
      );
    };

    reader.readAsText(myFile);
  });
}

function App() {
  const [threadData, setThreadData] = useState<ThreadAuditReport | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [error, setError] = useState<string>("");
  const [loadingFile, setLoadingFile] = useState<boolean>(false);
  const [fileReadError, setFileReadError] = useState<string | null>(null);
  const [parsedJsonData, setParsedJsonData] = useState<ParsedEmail[] | null>(
    null
  );
  const [isAuditing, setIsAuditing] = useState(false);

  const handleFileUploaded = async (file: File) => {
    // First, save the raw File object if you still need it for display or other purposes
    setUploadedFile(file);
    console.log("File uploaded:", file);

    // Now, immediately read and parse its content
    setLoadingFile(true); // Indicate that file processing is starting
    setFileReadError(null); // Clear previous errors
    setParsedJsonData(null); // Clear previous parsed data

    try {
      // Use the readFileContent function to get the parsed data
      const data = await readFileContent(file);
      setParsedJsonData(data); // Save the parsed JSON object to state
      console.log("Parsed JSON data saved to state:", data);

      // --- OPTIONAL: Further validation or actions based on parsedData structure ---
      // For example, if you know the JSON is a ThreadAuditRequest:
      // if (data && Array.isArray(data.emails)) {
      //   // Do something with the emails array
      // } else {
      //   throw new Error("Uploaded JSON does not contain an 'emails' array as expected.");
      // }
    } catch (error: any) {
      // Handle any errors during the file reading or JSON parsing
      setFileReadError(error.message);
      console.error(
        "Error in handleFileUploaded during file processing:",
        error
      );
    } finally {
      setLoadingFile(false); // Indicate that file processing has finished
    }
  };

  const clearResults = () => {
    setThreadData(null);
    setUploadedFile(null);
  };

  async function auditEmailThread() {
    setIsAuditing(true);
    try {
      const response = await fetch("http://localhost:3000/audit/thread", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsedJsonData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `API error: ${response.status} - ${
            errorData.error || response.statusText
          }`
        );
      }

      const result = await response.json();
      setThreadData(result);
      console.log("Thread Audit Result:", result);
    } catch (error) {
      console.error("Error auditing thread:", error);
    }
    setIsAuditing(false);
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (
      Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-full mr-3">
              <Mail className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">
              Email Audit Service
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Assess the quality and compliance of your email communications with
            our intelligent audit system. Upload your .json email files to
            receive detailed feedback and improvement recommendations.
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="text-center">
            <CardContent className="pt-6">
              <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Compliance Check</h3>
              <p className="text-gray-600">
                Ensure communications meet internal guidelines and standards
              </p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <Zap className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Dynamic Rules</h3>
              <p className="text-gray-600">
                Flexible rules engine with customizable audit criteria
              </p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <FileText className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Detailed Reports</h3>
              <p className="text-gray-600">
                Comprehensive feedback with actionable improvement suggestions
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="h-5 w-5 mr-2" />
              Upload Email Files
            </CardTitle>
            <CardDescription>
              Upload your .json file to begin the audit process.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileUpload onFileUploaded={handleFileUploaded} />
          </CardContent>
        </Card>

        {uploadedFile !== null && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Uploaded Files (1)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div
                  key={uploadedFile.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-blue-600 mr-3" />
                    <div>
                      <p className="font-medium">{uploadedFile.name}</p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(uploadedFile.size)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="text-center">
          <Button
            size="lg"
            className="px-8"
            onClick={auditEmailThread}
            disabled={isAuditing || uploadedFile === null}
          >
            {isAuditing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing Audit...
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 mr-2" />
                Start Audit Analysis
              </>
            )}
          </Button>
        </div>
        <AuditResults report={threadData} onClearResults={clearResults} />
      </div>
    </div>
  );
}

export default App;
