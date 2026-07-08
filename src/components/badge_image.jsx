import {
  useEffect,
  useState,
} from "react";

import {
  BiMedal,
} from "react-icons/bi";

function detetarMimeImagem(bytes) {
  if (
    !bytes ||
    bytes.length < 4
  ) {
    return "image/png";
  }

  if (
    bytes[0] === 0xff &&
    bytes[1] === 0xd8
  ) {
    return "image/jpeg";
  }

  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "image/png";
  }

  if (
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46
  ) {
    return "image/gif";
  }

  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46
  ) {
    return "image/webp";
  }

  return "image/png";
}

function bytesParaBase64(bytes) {
  let binary = "";

  const chunkSize =
    0x8000;

  for (
    let i = 0;
    i < bytes.length;
    i += chunkSize
  ) {
    const chunk =
      bytes.slice(
        i,
        i + chunkSize
      );

    binary +=
      String.fromCharCode.apply(
        null,
        chunk
      );
  }

  return window.btoa(
    binary
  );
}

export function normalizarImagemSrc(
  imagem
) {
  if (!imagem) {
    return null;
  }

  if (
    typeof imagem ===
    "string"
  ) {
    const valor =
      imagem.trim();

    if (!valor) {
      return null;
    }

    if (
      valor.startsWith(
        "http://"
      ) ||
      valor.startsWith(
        "https://"
      ) ||
      valor.startsWith(
        "data:image/"
      ) ||
      valor.startsWith("/")
    ) {
      return valor;
    }

    if (
      valor.startsWith(
        "\\x"
      )
    ) {
      const hex =
        valor.slice(2);

      const bytes = [];

      for (
        let i = 0;
        i < hex.length;
        i += 2
      ) {
        bytes.push(
          parseInt(
            hex.substring(
              i,
              i + 2
            ),
            16
          )
        );
      }

      const mime =
        detetarMimeImagem(
          bytes
        );

      return `data:${mime};base64,${bytesParaBase64(
        bytes
      )}`;
    }

    return valor;
  }

  if (
    imagem.type ===
      "Buffer" &&
    Array.isArray(
      imagem.data
    )
  ) {
    const bytes =
      imagem.data;

    const texto =
      new TextDecoder(
        "utf-8"
      )
        .decode(
          new Uint8Array(
            bytes
          )
        )
        .trim();

    if (
      texto.startsWith(
        "http://"
      ) ||
      texto.startsWith(
        "https://"
      ) ||
      texto.startsWith(
        "data:image/"
      ) ||
      texto.startsWith("/")
    ) {
      return texto;
    }

    const mime =
      detetarMimeImagem(
        bytes
      );

    return `data:${mime};base64,${bytesParaBase64(
      bytes
    )}`;
  }

  if (
    Array.isArray(imagem)
  ) {
    const bytes =
      imagem;

    const texto =
      new TextDecoder(
        "utf-8"
      )
        .decode(
          new Uint8Array(
            bytes
          )
        )
        .trim();

    if (
      texto.startsWith(
        "http://"
      ) ||
      texto.startsWith(
        "https://"
      ) ||
      texto.startsWith(
        "data:image/"
      ) ||
      texto.startsWith("/")
    ) {
      return texto;
    }

    const mime =
      detetarMimeImagem(
        bytes
      );

    return `data:${mime};base64,${bytesParaBase64(
      bytes
    )}`;
  }

  return null;
}

export function obterImagemBadge(
  badge
) {
  return normalizarImagemSrc(
    badge?.imagem_url ||
    badge?.imagem ||
    badge?.url_imagem ||
    null
  );
}

function BadgeImage({
  badge,
  imageUrl,
  nome = "Badge",
  size = 70,
  background = "#eff6ff",
  borderColor = "#dbeafe",
  padding = 6,
  borderRadius = "50%",
}) {
  const [erro, setErro] =
    useState(false);

  const src =
    normalizarImagemSrc(
      imageUrl ||
      badge?.imagem_url ||
      badge?.imagem ||
      badge?.url_imagem
    );

  useEffect(() => {
    setErro(false);
  }, [src]);

  const containerStyle = {
    width: size,
    height: size,
    minWidth: size,
    minHeight: size,
    borderRadius,
    background,
    border:
      `1px solid ${borderColor}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    overflow: "hidden",
  };

  if (
    !src ||
    erro
  ) {
    return (
      <div
        style={
          containerStyle
        }
      >
        <BiMedal
          size={size * 0.45}
          color="#f59e0b"
        />
      </div>
    );
  }

  return (
    <div
      style={
        containerStyle
      }
    >
      <img
        src={src}
        alt={
          nome ||
          badge?.nome ||
          badge?.nome_badge ||
          "Badge"
        }
        style={{
          width: "100%",
          height: "100%",
          objectFit:
            "contain",
          padding,
        }}
        onError={() => {
          console.error(
            "Erro ao carregar imagem do badge:",
            src
          );

          setErro(true);
        }}
      />
    </div>
  );
}

export default BadgeImage;