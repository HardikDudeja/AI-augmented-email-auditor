import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileText, AlertCircle } from "lucide-react";

interface FileUploadProps {
  onFileUploaded: (file: any) => void;
}

export function FileUpload({ onFileUploaded }: FileUploadProps) {
  const [error, setError] = useState<string>("");

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      setError("");

      if (rejectedFiles.length > 0) {
        setError("File rejected. Please only upload a single .json file.");
        return;
      }

      if (acceptedFiles.length === 0) {
        setError("No valid file selected.");
        return;
      }

      if (acceptedFiles.length > 1) {
        setError("Please upload only one .json file.");
        return;
      }

      onFileUploaded(acceptedFiles[0]);
    },
    [onFileUploaded]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      onDrop,
      accept: {
        "message/rfc822": [".json"],
        "application/octet-stream": [".json"],
      },
      maxSize: 10 * 1024 * 1024, // 10MB
      multiple: false, // ✅ Accept only one file
    });

  return (
    <div className="space-y-4">
      <Card
        {...getRootProps()}
        className={`border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
          isDragActive && !isDragReject
            ? "border-blue-500 bg-blue-50"
            : isDragReject
            ? "border-red-500 bg-red-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center space-y-4">
          <div
            className={`p-4 rounded-full ${
              isDragActive && !isDragReject
                ? "bg-blue-100"
                : isDragReject
                ? "bg-red-100"
                : "bg-gray-100"
            }`}
          >
            {isDragReject ? (
              <AlertCircle className="h-8 w-8 text-red-600" />
            ) : (
              <Upload
                className={`h-8 w-8 ${
                  isDragActive ? "text-blue-600" : "text-gray-600"
                }`}
              />
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">
              {isDragActive
                ? isDragReject
                  ? "Invalid file type"
                  : "Drop your file here"
                : "Upload Email File"}
            </h3>
            <p className="text-gray-600 mb-4">
              {isDragActive
                ? isDragReject
                  ? "Only .json files are accepted"
                  : "Release to upload"
                : "Drag and drop your .json file here, or click to browse"}
            </p>

            {!isDragActive && (
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Choose File
              </Button>
            )}
          </div>
        </div>
      </Card>

      <div className="text-sm text-gray-500 space-y-1">
        <p>• Supported format: .json</p>
        <p>• Maximum file size: 10MB</p>
        <p>• Only one file can be uploaded at a time</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
