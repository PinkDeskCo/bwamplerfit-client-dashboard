"use strict";

(() => {
    const inner = document.querySelector(
        "#challenge-certificate-preview " +
        ".challenge-certificate-preview__inner"
    );

    const footer = inner?.querySelector(
        ".challenge-certificate-preview__footer"
    );

    if (
        !inner ||
        !footer ||
        inner.querySelector(".trot-certificate-art")
    ) {
        return;
    }

    const colors = [
        "#D5A32A",
        "#B85D32",
        "#69764B",
        "#913E51",
        "#C5A56A"
    ];

    const feathers = Array.from(
        { length: 30 },
        (_, index) => {
            const angle = -87 + index * 6;
            const color = colors[Math.floor(index / 6)];

            return `
                <g transform="rotate(${angle} 200 198)">
                    <path
                        d="
                            M200 198
                            C185 150 187 60 200 28
                            C213 60 215 150 200 198Z
                        "
                        fill="${color}"
                        stroke="#846548"
                        stroke-width=".8"
                    />

                    <path
                        d="
                            M200 48V190
                            M200 75l-6-9
                            M200 100l6-9
                            M200 125l-6-9
                        "
                        stroke="#fff2cf"
                        stroke-width="1.2"
                        fill="none"
                        opacity=".7"
                    />
                </g>
            `;
        }
    ).join("");

    const svg = `
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 400 290"
            fill="none"
        >
            <ellipse
                cx="200" cy="269"
                rx="65" ry="8"
                fill="#684521"
                opacity=".1"
            />

            ${feathers}

            <path
                d="
                    M183 239v22l-13 7
                    m13-7 10 7
                    m27-29v22l13 7
                    m-13-7-10 7
                "
                stroke="#a6652e"
                stroke-width="5"
                stroke-linecap="round"
            />

            <ellipse
                cx="200" cy="211"
                rx="43" ry="40"
                fill="#70432d"
            />

            <path
                d="
                    M167 203
                    C155 232 180 245 195 225
                    C177 228 184 211 167 203Z
                "
                fill="#b97744"
            />

            <ellipse
                cx="211" cy="169"
                rx="23" ry="29"
                fill="#bb7848"
            />

            <path
                d="M228 174l18 8-19 7"
                fill="#e8b343"
            />

            <path
                d="
                    M226 186
                    C240 188 238 212 228 211
                    C219 210 222 197 226 186Z
                "
                fill="#aa3e35"
            />

            <circle
                cx="219" cy="163" r="6"
                fill="#fff7df"
            />

            <circle
                cx="221" cy="163" r="3"
                fill="#30261c"
            />

            <path
                d="M202 140q-7-14 2-14t5 13"
                fill="#aa3e35"
            />
        </svg>
    `;

    const artwork = document.createElement("figure");

    artwork.className = "trot-certificate-art";

    const image = document.createElement("img");

    image.alt =
        "A turkey with a full fan of autumn-colored feathers";

    image.width = 400;
    image.height = 290;

    image.src =
        "data:image/svg+xml;charset=utf-8," +
        encodeURIComponent(svg);

    artwork.appendChild(image);
    inner.insertBefore(artwork, footer);

    const styles = document.createElement("style");

    styles.textContent = `
        .trot-certificate-art {
            display: flex;
            align-items: center;
            justify-content: center;
            flex: 1 0 auto;
            width: 100%;
            margin: 18px auto;
        }

        .trot-certificate-art img {
            display: block;
            width: auto;
            max-width: 100%;
            height: clamp(130px, 18vw, 190px);
            object-fit: contain;
        }

        .challenge-certificate-preview__inner
        > .challenge-certificate-preview__footer {
            margin-top: 18px;
        }

        .challenge-certificate-preview.is-exporting
        .challenge-certificate-preview__inner > * {
            transform: none;
        }

        .challenge-certificate-preview.is-exporting
        .trot-certificate-art {
            flex: 1 0 0;
            min-height: 0;
            margin: 18px auto;
        }

        .challenge-certificate-preview.is-exporting
        .trot-certificate-art img {
            height: 190px;
        }

        .challenge-certificate-preview.is-exporting
        .challenge-certificate-preview__footer {
            margin: 0 28px;
        }
    `;

    document.head.appendChild(styles);
})();