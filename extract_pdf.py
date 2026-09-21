import sys

# Extract all text from the project PDF so it can be reviewed.
try:
    import pypdf
    Reader = pypdf.PdfReader
except ImportError:
    try:
        import PyPDF2
        Reader = PyPDF2.PdfReader
    except ImportError:
        print("Neither pypdf nor PyPDF2 is installed. Run: pip install pypdf")
        sys.exit(1)

r = Reader("Research papper web dialer + crm.pdf")
print("PAGES:", len(r.pages))
for i, page in enumerate(r.pages):
    print(f"--- PAGE {i+1} ---")
    print(page.extract_text())
