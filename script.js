(() => {
  const profileKey = "ahmad-fikri-profile-image";
  const backgroundKey = "ahmad-fikri-background-image";
  const status = document.getElementById("image-status");
  const profileInput = document.getElementById("profile-image-input");
  const backgroundInput = document.getElementById("background-image-input");
  const animeVideoInput = document.getElementById("anime-video-input");
  const animeVideoPlayer = document.getElementById("anime-video-player");
  const animeVideoPlaceholder = document.getElementById(
    "anime-video-placeholder",
  );
  const animeVideoStatus = document.getElementById("anime-video-status");
  const removeAnimeVideoButton = document.getElementById("remove-anime-video");
  let animeVideoUrl = "";

  function showStatus(message) {
    status.textContent = message;
  }

  function renderProfileImage(dataUrl) {
    document
      .querySelectorAll(".profile-photo, .portrait-photo")
      .forEach((image) => {
        image.src = dataUrl;
        image.classList.add("is-visible");
      });
  }

  function renderBackgroundImage(dataUrl) {
    document.body.classList.toggle("has-user-background", Boolean(dataUrl));
    if (dataUrl) {
      document.body.style.setProperty("--user-background", `url("${dataUrl}")`);
    } else {
      document.body.style.removeProperty("--user-background");
    }
  }

  function compressImage(file) {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith("image/")) {
        reject(new Error("Pilih file gambar yang valid."));
        return;
      }
      if (file.size > 15 * 1024 * 1024) {
        reject(new Error("Ukuran gambar maksimal 15 MB."));
        return;
      }

      const objectUrl = URL.createObjectURL(file);
      const source = new Image();
      source.onload = () => {
        try {
          const scale = Math.min(
            1,
            1200 / Math.max(source.naturalWidth, source.naturalHeight),
          );
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(source.naturalWidth * scale));
          canvas.height = Math.max(1, Math.round(source.naturalHeight * scale));
          const context = canvas.getContext("2d");
          if (!context) {
            throw new Error("Browser tidak dapat memproses gambar.");
          }
          context.fillStyle = "#fff";
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.drawImage(source, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.78));
        } catch (error) {
          reject(error);
        } finally {
          URL.revokeObjectURL(objectUrl);
        }
      };
      source.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Gambar tidak dapat dibuka. Coba file gambar lain."));
      };
      source.src = objectUrl;
    });
  }

  async function saveImage(input, key, render, label) {
    const file = input.files && input.files[0];
    if (!file) return;
    try {
      const dataUrl = await compressImage(file);
      localStorage.setItem(key, dataUrl);
      render(dataUrl);
      showStatus(`${label} berhasil diperbarui dan tersimpan di browser ini.`);
    } catch (error) {
      console.error("Gagal menyimpan gambar biodata:", error);
      showStatus(
        error instanceof DOMException && error.name === "QuotaExceededError"
          ? "Penyimpanan browser penuh. Hapus gambar lama atau pilih gambar lebih kecil."
          : error.message || "Gambar gagal disimpan. Coba lagi.",
      );
    } finally {
      input.value = "";
    }
  }

  profileInput.addEventListener("change", () => {
    saveImage(profileInput, profileKey, renderProfileImage, "Foto profil");
  });
  backgroundInput.addEventListener("change", () => {
    saveImage(
      backgroundInput,
      backgroundKey,
      renderBackgroundImage,
      "Gambar latar",
    );
  });

  function clearAnimeVideo() {
    animeVideoPlayer.pause();
    animeVideoPlayer.removeAttribute("src");
    animeVideoPlayer.load();
    animeVideoPlayer.hidden = true;
    animeVideoPlaceholder.hidden = false;
    removeAnimeVideoButton.disabled = true;
    if (animeVideoUrl) {
      URL.revokeObjectURL(animeVideoUrl);
      animeVideoUrl = "";
    }
  }

  animeVideoInput.addEventListener("change", () => {
    const file = animeVideoInput.files && animeVideoInput.files[0];
    if (!file) return;

    const videoExtension = /\.(mp4|m4v|mov|webm|ogv|ogg|avi|mkv)$/i.test(
      file.name,
    );
    if (!file.type.startsWith("video/") && !videoExtension) {
      animeVideoStatus.textContent = "Pilih file video yang valid.";
      animeVideoInput.value = "";
      return;
    }

    clearAnimeVideo();
    animeVideoUrl = URL.createObjectURL(file);
    animeVideoPlayer.src = animeVideoUrl;
    animeVideoPlayer.hidden = false;
    animeVideoPlaceholder.hidden = true;
    removeAnimeVideoButton.disabled = false;
    animeVideoStatus.textContent =
      "Video siap diputar. File hanya tersedia di browser ini selama halaman terbuka.";
    animeVideoInput.value = "";
  });

  animeVideoPlayer.addEventListener("error", () => {
    animeVideoStatus.textContent =
      "Video tidak dapat diputar oleh browser ini. Coba file MP4 atau WebM.";
  });

  removeAnimeVideoButton.addEventListener("click", () => {
    clearAnimeVideo();
    animeVideoStatus.textContent = "Video berhasil dihapus dari pemutar.";
  });

  document
    .getElementById("remove-profile-image")
    .addEventListener("click", () => {
      try {
        localStorage.removeItem(profileKey);
        document
          .querySelectorAll(".profile-photo, .portrait-photo")
          .forEach((image) => {
            image.removeAttribute("src");
            image.classList.remove("is-visible");
          });
        showStatus("Foto profil berhasil dihapus.");
      } catch (error) {
        console.error("Gagal menghapus foto profil:", error);
        showStatus("Foto profil tidak dapat dihapus dari penyimpanan browser.");
      }
    });
  document
    .getElementById("remove-background-image")
    .addEventListener("click", () => {
      try {
        localStorage.removeItem(backgroundKey);
        renderBackgroundImage("");
        showStatus("Gambar latar berhasil dihapus.");
      } catch (error) {
        console.error("Gagal menghapus gambar latar:", error);
        showStatus(
          "Gambar latar tidak dapat dihapus dari penyimpanan browser.",
        );
      }
    });

  try {
    const savedProfile = localStorage.getItem(profileKey);
    const savedBackground = localStorage.getItem(backgroundKey);
    if (savedProfile) renderProfileImage(savedProfile);
    if (savedBackground) renderBackgroundImage(savedBackground);
  } catch (error) {
    console.error(
      "Gagal membaca gambar biodata dari penyimpanan browser:",
      error,
    );
    showStatus(
      "Browser tidak mengizinkan penyimpanan gambar untuk halaman ini.",
    );
  }
})();
