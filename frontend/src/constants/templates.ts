export type SupportedLanguage = "python" | "c" | "cpp" | "java" | "javascript";

export const languageLabels: Record<SupportedLanguage, string> = {
  python: "Python",
  c: "C",
  cpp: "C++",
  java: "Java",
  javascript: "JavaScript"
};

export const languageTemplates: Record<SupportedLanguage, string> = {
  python: 'print("Hello, World!")\n',
  c: '#include <stdio.h>\n\nint main(void) {\n    printf("Hello, World!\\n");\n    return 0;\n}\n',
  cpp: '#include <iostream>\n\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}\n',
  java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}\n',
  javascript: 'console.log("Hello, World!");\n'
};
