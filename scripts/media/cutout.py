# cutout.py <in> <out.png>: remove the background, keep the object with an alpha channel.
# Run by build.mjs through .venv-media (see scripts/media/README.md for setup).
import sys

from PIL import Image
from rembg import new_session, remove

image = Image.open(sys.argv[1]).convert("RGB")
remove(image, session=new_session("isnet-general-use"), post_process_mask=True).save(sys.argv[2])
