"""Shared paths for the Playwright tests: built pages in <repo>/build (python3 src/build_pages.py), three.js r128 from npm."""
import os
HERE=os.path.dirname(os.path.abspath(__file__)); REPO=os.path.dirname(os.path.dirname(HERE))
BUILD=os.environ.get('PAGES_OUT', os.path.join(REPO,'build'))
THREE128=os.path.join(HERE,'node_modules','three','build','three.js')
QRCODE=os.path.join(HERE,'node_modules','qrcode-generator','qrcode.js')
OUTDIR=os.path.join(HERE,'out'); os.makedirs(OUTDIR, exist_ok=True)
