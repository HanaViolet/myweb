import os
import sys
from PIL import Image

# 兼容 Windows 控制台编码输出
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# ================= 配置区域 =================
# 需要扫描压缩的文件夹列表
SOURCE_DIRS = ['source/img', 'source/_posts']

# 触发压缩的最小文件大小阈值 (单位: MB, 300KB)
MIN_SIZE_MB = 0.3

# 图片最长边最大像素值 (超过自动等比例缩放)
MAX_DIMENSION = 1920

# JPG 保存质量 (1-95)，推荐 78，视觉无损且体积大幅减小
QUALITY = 78

# 只有节省达到这个大小才替换原文件，避免为几 KB 的收益重复编码 JPEG
MIN_SAVINGS_MB = 0.01
# ===========================================

def get_size_mb(file_path):
    return os.path.getsize(file_path) / (1024 * 1024)

def process_image(file_path):
    orig_size = get_size_mb(file_path)
    if orig_size < MIN_SIZE_MB:
        return False, 0

    file_name = os.path.basename(file_path)
    ext = os.path.splitext(file_name)[1].lower()
    
    if ext not in ('.jpg', '.jpeg', '.png', '.webp'):
        return False, 0

    print(f"[Target] {file_name} ({orig_size:.2f} MB)")
    
    try:
        with Image.open(file_path) as img:
            w, h = img.size

            # 特殊对待 favicon / 头像，如果是 sakura.jpg 特殊调整为 512px 图标像素
            if file_name.lower() in ('sakura.jpg', 'favicon.jpg', 'avatar.jpg') and (w > 512 or h > 512):
                img.thumbnail((512, 512), Image.Resampling.LANCZOS)
                print(f"  [Favicon Scale] {w}x{h} -> {img.size[0]}x{img.size[1]}")
            elif max(w, h) > MAX_DIMENSION:
                img.thumbnail((MAX_DIMENSION, MAX_DIMENSION), Image.Resampling.LANCZOS)
                print(f"  [Resize] {w}x{h} -> {img.size[0]}x{img.size[1]}")

            # 按原格式优化：PNG 保留透明通道，避免把 .png 文件写成 JPEG
            temp_path = file_path + ".tmp"
            if ext in ('.jpg', '.jpeg'):
                if img.mode not in ('RGB', 'L'):
                    img = img.convert('RGB')
                img.save(temp_path, 'JPEG', quality=QUALITY, optimize=True, progressive=True)
            elif ext == '.png':
                if img.mode not in ('1', 'L', 'LA', 'P', 'RGB', 'RGBA'):
                    img = img.convert('RGBA' if 'A' in img.getbands() else 'RGB')
                img.save(temp_path, 'PNG', optimize=True, compress_level=9)
            else:  # WebP
                if img.mode not in ('RGB', 'RGBA'):
                    img = img.convert('RGBA' if 'A' in img.getbands() else 'RGB')
                img.save(temp_path, 'WEBP', quality=QUALITY, method=6)
            
            new_size = get_size_mb(temp_path)
            
            if new_size < orig_size and (orig_size - new_size) >= MIN_SAVINGS_MB:
                os.replace(temp_path, file_path)
                saved = orig_size - new_size
                print(f"  [Success] {orig_size:.2f} MB -> {new_size:.2f} MB (Saved {saved:.2f} MB)")
                return True, saved
            else:
                if os.path.exists(temp_path):
                    os.remove(temp_path)
                print("  [Info] Keep original")
                return False, 0

    except Exception as e:
        print(f"  [Error] {e}")
        if os.path.exists(file_path + ".tmp"):
            os.remove(file_path + ".tmp")
        return False, 0

def main():
    total_count = 0
    total_saved = 0
    print("Start image optimization ...")

    for dir_path in SOURCE_DIRS:
        if not os.path.exists(dir_path):
            print(f"Warning: Directory '{dir_path}' not found.")
            continue
        
        print(f"\nScanning: {dir_path}")
        for root, dirs, files in os.walk(dir_path):
            for file in files:
                full_path = os.path.join(root, file)
                success, saved = process_image(full_path)
                if success:
                    total_count += 1
                    total_saved += saved

    print(f"\nOptimization Finished! Total optimized: {total_count} images, saved: {total_saved:.2f} MB!")

if __name__ == '__main__':
    main()
