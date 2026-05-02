import os
import re

def analyze_code_files(base_path):
    results = {}
    
    # Design Tokens from design.md
    EXPECTED_COLORS = ["#01696f", "#da7101", "#f7f6f2", "#ffffff"]
    # Major violations to look for
    MATERIAL_ICONS_REGEX = re.compile(r"material-symbols-outlined", re.IGNORECASE)
    HREF_EMPTY_REGEX = re.compile(r'href="#"', re.IGNORECASE)
    ROUNDED_XL_REGEX = re.compile(r'rounded-xl', re.IGNORECASE)
    
    for root, dirs, files in os.walk(base_path):
        for file in files:
            if file == "code.html":
                file_path = os.path.join(root, file)
                rel_path = os.path.relpath(file_path, base_path)
                
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                issues = []
                if MATERIAL_ICONS_REGEX.search(content):
                    issues.append("Violation: Uses Material Symbols instead of Phosphor Icons")
                
                if HREF_EMPTY_REGEX.search(content):
                    issues.append("Violation: Contains unlinked '#' hrefs")
                
                if ROUNDED_XL_REGEX.search(content):
                    issues.append("Violation: Uses rounded-xl instead of rounded-lg/md")
                
                # Check for M3 token bloat (many tokens starting with 'on-', 'surface-container', etc.)
                if "surface-container-highest" in content or "on-primary-fixed" in content:
                    issues.append("Warning: Contains Material Design 3 token bloat")
                
                if issues:
                    results[rel_path] = issues
                    
    return results

if __name__ == "__main__":
    base_dir = "/Users/kawinperera/Fresh as Ever/fresh-as-ever/stitch_fresh_as_ever_food_rescue-2"
    analysis = analyze_code_files(base_dir)
    
    with open("analysis_report.txt", "w") as f:
        for path, issues in analysis.items():
            f.write(f"File: {path}\n")
            for issue in issues:
                f.write(f"  - {issue}\n")
            f.write("\n")
    
    print(f"Analysis complete. Found issues in {len(analysis)} files.")
