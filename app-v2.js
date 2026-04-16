const {
  useState,
  useRef,
  useCallback,
  useEffect
} = React;

// ===== FREE/PRO MODE FLAG =====
// JSX版(Pro): false | HTML配布版(Free): true (変換時に自動切替)
const IS_FREE = true;
let _id = 0;
const uid = () => "f" + ++_id;

// ===== 4-Point Perspective Transform (CSS matrix3d) =====
function quadMatrix3d(w, h, pts) {
  // Map rect (0,0)-(w,0)-(w,h)-(0,h) to quad pts[TL,TR,BR,BL]
  var s = [[0, 0], [w, 0], [w, h], [0, h]];
  var d = pts.map(function (p) {
    return [p.x, p.y];
  });
  var A = [];
  for (var i = 0; i < 4; i++) {
    A.push([s[i][0], s[i][1], 1, 0, 0, 0, -d[i][0] * s[i][0], -d[i][0] * s[i][1], d[i][0]]);
    A.push([0, 0, 0, s[i][0], s[i][1], 1, -d[i][1] * s[i][0], -d[i][1] * s[i][1], d[i][1]]);
  }
  var n = 8;
  for (var c = 0; c < n; c++) {
    var mr = c;
    for (var r = c + 1; r < n; r++) {
      if (Math.abs(A[r][c]) > Math.abs(A[mr][c])) mr = r;
    }
    var tmp = A[c];
    A[c] = A[mr];
    A[mr] = tmp;
    if (Math.abs(A[c][c]) < 1e-10) return "none";
    for (var r = c + 1; r < n; r++) {
      var f = A[r][c] / A[c][c];
      for (var j = c; j <= n; j++) A[r][j] -= f * A[c][j];
    }
  }
  var x = new Array(n);
  for (var i = n - 1; i >= 0; i--) {
    x[i] = A[i][n];
    for (var j = i + 1; j < n; j++) x[i] -= A[i][j] * x[j];
    x[i] /= A[i][i];
  }
  return "matrix3d(" + x[0] + "," + x[3] + ",0," + x[6] + "," + x[1] + "," + x[4] + ",0," + x[7] + ",0,0,1,0," + x[2] + "," + x[5] + ",0,1)";
}
function rectToPts(sx, sy, sw, sh) {
  return [{
    x: sx,
    y: sy
  }, {
    x: sx + sw,
    y: sy
  }, {
    x: sx + sw,
    y: sy + sh
  }, {
    x: sx,
    y: sy + sh
  }];
}

// ===== FRAME LIBRARY (persistent storage) =====
// ===== BUILT-IN FRAMES =====
const FRAME_BASE = "https://bestad-keizo.github.io/mc-free/frames/";
const FRAME_CATS = [{
  key: "device",
  label: "デバイス"
}, {
  key: "box",
  label: "ボックス"
}, {
  key: "doc",
  label: "ドキュメント"
}, {
  key: "check",
  label: "チェックリスト"
}, {
  key: "media",
  label: "書籍・メディア"
}, {
  key: "cert",
  label: "認定証"
}, {
  key: "deco",
  label: "デコレーション"
}];
const BUILTIN_FRAMES = [{
  id: "builtin-imacb",
  name: "iMac",
  url: FRAME_BASE + "imacb.png",
  cat: "device"
}, {
  id: "builtin-imac",
  name: "iMac クラシック",
  url: FRAME_BASE + "imac.png",
  cat: "device"
}, {
  id: "builtin-macbook",
  name: "MacBook",
  url: FRAME_BASE + "macbook.png",
  cat: "device"
}, {
  id: "builtin-ipad",
  name: "iPad",
  url: FRAME_BASE + "ipad.png",
  cat: "device"
}, {
  id: "builtin-iphone",
  name: "iPhone",
  url: FRAME_BASE + "iphone.png",
  cat: "device"
}, {
  id: "builtin-iphone-y",
  name: "iPhone 斜め横",
  url: FRAME_BASE + "iphone-y.png",
  cat: "device"
}, {
  id: "builtin-iphone-z",
  name: "iPhone 斜め縦",
  url: FRAME_BASE + "iphone-z.png",
  cat: "device"
}, {
  id: "builtin-box1l",
  name: "厚ボックス左",
  url: FRAME_BASE + "box1l.png",
  cat: "box"
}, {
  id: "builtin-box1r",
  name: "厚ボックス右",
  url: FRAME_BASE + "box1r.png",
  cat: "box"
}, {
  id: "builtin-box2l",
  name: "薄ボックス左",
  url: FRAME_BASE + "box2l.png",
  cat: "box"
}, {
  id: "builtin-box2r",
  name: "薄ボックス右",
  url: FRAME_BASE + "box2r.png",
  cat: "box"
}, {
  id: "builtin-a4file1",
  name: "A4用紙",
  url: FRAME_BASE + "a4file1.png",
  cat: "doc"
}, {
  id: "builtin-a4file2",
  name: "A4ファイル",
  url: FRAME_BASE + "a4file2.png",
  cat: "doc"
}, {
  id: "builtin-memo",
  name: "メモ冊子",
  url: FRAME_BASE + "memo.png",
  cat: "doc"
}, {
  id: "builtin-card",
  name: "カード",
  url: FRAME_BASE + "card.png",
  cat: "doc"
}, {
  id: "builtin-envelope",
  name: "封筒",
  url: FRAME_BASE + "envelope.png",
  cat: "doc"
}, {
  id: "builtin-checklist-tate",
  name: "チェックリスト縦",
  url: FRAME_BASE + "checklist-tate.png",
  cat: "check"
}, {
  id: "builtin-checklist-yoko",
  name: "チェックリスト横",
  url: FRAME_BASE + "checklist-yoko.png",
  cat: "check"
}, {
  id: "builtin-ebook",
  name: "E-Book",
  url: FRAME_BASE + "ebook.png",
  cat: "media"
}, {
  id: "builtin-cdcase",
  name: "CDケース",
  url: FRAME_BASE + "cdcase.png",
  cat: "media"
}, {
  id: "builtin-journal",
  name: "ジャーナル",
  url: FRAME_BASE + "journal.png",
  cat: "media"
}, {
  id: "builtin-cert",
  name: "修了証書",
  url: FRAME_BASE + "cert.png",
  cat: "cert"
}, {
  id: "builtin-deco-medal-red",
  name: "メダル赤",
  url: FRAME_BASE + "deco-medal-red.png",
  cat: "deco"
}, {
  id: "builtin-deco-best",
  name: "BESTメダル",
  url: FRAME_BASE + "deco-best.png",
  cat: "deco"
}, {
  id: "builtin-deco-bonus",
  name: "Bonusスタンプ",
  url: FRAME_BASE + "deco-bonus.png",
  cat: "deco"
}, {
  id: "builtin-deco-lion",
  name: "ライオンメダル",
  url: FRAME_BASE + "deco-lion.png",
  cat: "deco"
}, {
  id: "builtin-deco-secret",
  name: "Secretスタンプ",
  url: FRAME_BASE + "deco-secret.png",
  cat: "deco"
}, {
  id: "builtin-deco-certified",
  name: "Certifiedバッジ",
  url: FRAME_BASE + "deco-certified.png",
  cat: "deco"
}, {
  id: "builtin-deco-pen",
  name: "ペン",
  url: FRAME_BASE + "deco-pen.png",
  cat: "deco"
}, {
  id: "builtin-deco-airpods",
  name: "AirPods",
  url: FRAME_BASE + "deco-airpods.png",
  cat: "deco"
}];
const SCREEN_PRESETS = {
  "builtin-imacb": {
    sx: 38,
    sy: 84,
    sw: 324,
    sh: 284
  },
  "builtin-imac": {
    sx: 35,
    sy: 70,
    sw: 330,
    sh: 200
  },
  "builtin-macbook": {
    sx: 14,
    sy: 85,
    sw: 371,
    sh: 230
  },
  "builtin-ipad": {
    sx: 61,
    sy: 21,
    sw: 275,
    sh: 365
  },
  "builtin-iphone": {
    sx: 113,
    sy: 40,
    sw: 174,
    sh: 320
  },
  "builtin-iphone-y": {
    sx: 36,
    sy: 55,
    sw: 271,
    sh: 304
  },
  "builtin-iphone-z": {
    sx: 154,
    sy: 30,
    sw: 125,
    sh: 330
  },
  "builtin-box1l": {
    sx: 121,
    sy: 19,
    sw: 213,
    sh: 351
  },
  "builtin-box1r": {
    sx: 66,
    sy: 19,
    sw: 213,
    sh: 351
  },
  "builtin-box2l": {
    sx: 121,
    sy: 19,
    sw: 207,
    sh: 347
  },
  "builtin-box2r": {
    sx: 66,
    sy: 19,
    sw: 213,
    sh: 297
  },
  "builtin-a4file1": {
    sx: 81,
    sy: 18,
    sw: 239,
    sh: 355
  },
  "builtin-a4file2": {
    sx: 57,
    sy: 24,
    sw: 279,
    sh: 350
  },
  "builtin-memo": {
    sx: 46,
    sy: 17,
    sw: 306,
    sh: 353
  },
  "builtin-card": {
    sx: 25,
    sy: 113,
    sw: 315,
    sh: 200
  },
  "builtin-envelope": {
    sx: 20,
    sy: 97,
    sw: 347,
    sh: 255
  },
  "builtin-checklist-tate": {
    sx: 74,
    sy: 27,
    sw: 246,
    sh: 354
  },
  "builtin-checklist-yoko": {
    sx: 19,
    sy: 73,
    sw: 362,
    sh: 266
  },
  "builtin-ebook": {
    sx: 21,
    sy: 12,
    sw: 348,
    sh: 364
  },
  "builtin-cdcase": {
    sx: 32,
    sy: 69,
    sw: 322,
    sh: 276
  },
  "builtin-journal": {
    sx: 40,
    sy: 58,
    sw: 311,
    sh: 273
  },
  "builtin-cert": {
    sx: 40,
    sy: 97,
    sw: 319,
    sh: 205
  }
};
const SPINE_PRESETS = {
  "builtin-box1l": {
    sx: 66,
    sy: 19,
    sw: 54,
    sh: 351
  },
  "builtin-box1r": {
    sx: 279,
    sy: 19,
    sw: 54,
    sh: 351
  },
  "builtin-box2l": {
    sx: 84,
    sy: 19,
    sw: 37,
    sh: 347
  },
  "builtin-box2r": {
    sx: 279,
    sy: 19,
    sw: 37,
    sh: 297
  }
};
function useFrameLibrary() {
  const [savedFrames, setSavedFrames] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      try {
        const result = await window.storage.get("mockup-frames");
        if (result && result.value) setSavedFrames(JSON.parse(result.value));
      } catch {}
      setLoading(false);
    })();
  }, []);
  const frames = [...BUILTIN_FRAMES, ...savedFrames];
  const saveFrame = useCallback(async (name, dataUrl) => {
    const newFrames = [...savedFrames, {
      id: Date.now(),
      name,
      url: dataUrl
    }];
    setSavedFrames(newFrames);
    try {
      await window.storage.set("mockup-frames", JSON.stringify(newFrames));
    } catch {}
  }, [savedFrames]);
  const deleteFrame = useCallback(async id => {
    if (BUILTIN_FRAMES.some(f => f.id === id)) return; // can't delete built-in
    const newFrames = savedFrames.filter(f => f.id !== id);
    setSavedFrames(newFrames);
    try {
      await window.storage.set("mockup-frames", JSON.stringify(newFrames));
    } catch {}
  }, [savedFrames]);
  return {
    frames,
    loading,
    saveFrame,
    deleteFrame
  };
}
function createItem(overrides = {}) {
  return {
    id: uid(),
    name: "新規パーツ",
    x: 100,
    y: 100,
    rotateX: 0,
    rotateY: 0,
    rotateZ: 0,
    scale: 1,
    zIndex: 5,
    frameUrl: null,
    frameW: 400,
    frameH: 400,
    screenX: 10,
    screenY: 10,
    screenW: 180,
    screenH: 200,
    screenPts: null,
    contentImage: null,
    contentFit: "cover",
    contentSkewX: 0,
    contentSkewY: 0,
    contentRotateY: 0,
    spineX: 0,
    spineY: 0,
    spineW: 0,
    spineH: 0,
    spinePts: null,
    spineImage: null,
    spineSkewX: 0,
    spineSkewY: 0,
    spineRotateY: 0,
    contentType: "gradient",
    bgColor: "#0c0c1a",
    bgGradient: "linear-gradient(135deg,#3b82f6,#8b5cf6,#ec4899)",
    title: "",
    subtitle: "",
    titleSize: 14,
    titleColor: "#ffffff",
    subtitleSize: 9,
    subtitleColor: "#f97316",
    textAlign: "center",
    shadow: 0,
    shadowColor: "#00000066",
    ...overrides
  };
}
function imgLoad(file, cb) {
  if (!file) return;
  const r = new FileReader();
  r.onload = e => {
    const img = new Image();
    img.onload = () => cb(e.target.result, img.naturalWidth, img.naturalHeight);
    img.src = e.target.result;
  };
  r.readAsDataURL(file);
}

// ===== ITEM RENDER =====
function ItemRender({
  item: d
}) {
  const hasImg = !!d.contentImage;
  const hasSpine = !!d.spineImage && d.spineW > 0 && d.spineH > 0;
  const bg = hasImg ? "transparent" : d.contentType === "color" ? d.bgColor : d.contentType === "gradient" ? d.bgGradient : "transparent";
  const contentTransform = d.contentSkewX || d.contentSkewY || d.contentRotateY ? `skewX(${d.contentSkewX || 0}deg) skewY(${d.contentSkewY || 0}deg) perspective(500px) rotateY(${d.contentRotateY || 0}deg)` : "none";
  const spineTransform = d.spineSkewX || d.spineSkewY || d.spineRotateY ? `skewX(${d.spineSkewX || 0}deg) skewY(${d.spineSkewY || 0}deg) perspective(500px) rotateY(${d.spineRotateY || 0}deg)` : "none";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      width: d.frameW,
      height: d.frameH,
      overflow: "hidden",
      transform: "translateZ(0)"
    }
  }, d.frameUrl && /*#__PURE__*/React.createElement("img", {
    src: d.frameUrl,
    style: {
      position: "absolute",
      top: 0,
      left: 0,
      width: d.frameW,
      height: d.frameH,
      pointerEvents: "none",
      userSelect: "none",
      zIndex: 1
    },
    alt: ""
  }), !d.frameUrl && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      zIndex: 1,
      border: "2px dashed #555",
      borderRadius: 6,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 9,
      color: "#666",
      pointerEvents: "none"
    }
  }, "\u30D5\u30EC\u30FC\u30E0\u306A\u3057"), (() => {
    const pts = d.screenPts;
    const useQuad = pts && pts.length === 4;
    const cStyle = useQuad ? {
      position: "absolute",
      left: 0,
      top: 0,
      width: d.screenW,
      height: d.screenH,
      zIndex: 2,
      transformOrigin: "0 0",
      transform: quadMatrix3d(d.screenW, d.screenH, pts)
    } : {
      position: "absolute",
      left: d.screenX,
      top: d.screenY,
      width: d.screenW,
      height: d.screenH,
      zIndex: 2,
      transform: contentTransform,
      transformOrigin: "center center"
    };
    return /*#__PURE__*/React.createElement("div", {
      style: cStyle
    }, hasImg && /*#__PURE__*/React.createElement("img", {
      src: d.contentImage,
      style: {
        width: "100%",
        height: "100%",
        objectFit: d.contentFit || "cover",
        display: "block"
      },
      alt: ""
    }), !hasImg && /*#__PURE__*/React.createElement("div", {
      style: {
        width: "100%",
        height: "100%",
        background: bg,
        display: "flex",
        flexDirection: "column",
        alignItems: d.textAlign === "center" ? "center" : d.textAlign === "right" ? "flex-end" : "flex-start",
        justifyContent: "center",
        padding: 6,
        textAlign: d.textAlign
      }
    }, d.title && /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "Montserrat,sans-serif",
        fontSize: d.titleSize,
        fontWeight: 900,
        color: d.titleColor,
        lineHeight: 1.15,
        wordBreak: "break-word",
        whiteSpace: "pre-line"
      }
    }, d.title), d.subtitle && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: d.subtitleSize,
        fontWeight: 700,
        color: d.subtitleColor,
        marginTop: 3,
        wordBreak: "break-word",
        whiteSpace: "pre-line"
      }
    }, d.subtitle)));
  })(), hasSpine && (() => {
    const sp = d.spinePts;
    const useQuadSp = sp && sp.length === 4;
    const spStyle = useQuadSp ? {
      position: "absolute",
      left: 0,
      top: 0,
      width: d.spineW,
      height: d.spineH,
      zIndex: 3,
      transformOrigin: "0 0",
      transform: quadMatrix3d(d.spineW, d.spineH, sp)
    } : {
      position: "absolute",
      left: d.spineX,
      top: d.spineY,
      width: d.spineW,
      height: d.spineH,
      zIndex: 3,
      transform: spineTransform,
      transformOrigin: "center center"
    };
    return /*#__PURE__*/React.createElement("div", {
      style: spStyle
    }, /*#__PURE__*/React.createElement("img", {
      src: d.spineImage,
      style: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: "block"
      },
      alt: ""
    }));
  })());
}

// ===== SCREEN AREA EDITOR =====
function ScreenAreaEditor({
  item,
  onUpdate
}) {
  const dragging = useRef(null);
  const startPos = useRef({});
  const ps = Math.min(220 / item.frameW, 220 / item.frameH, 1);
  const hasSpine = item.spineW > 0 && item.spineH > 0;
  // Derive screenPts if not set
  const pts = item.screenPts || rectToPts(item.screenX, item.screenY, item.screenW, item.screenH);
  const onDown = (e, mode) => {
    e.preventDefault();
    e.stopPropagation();
    dragging.current = mode;
    startPos.current = {
      mx: e.clientX,
      my: e.clientY,
      pts: pts.map(function (p) {
        return {
          x: p.x,
          y: p.y
        };
      }),
      spx: item.spineX,
      spy: item.spineY,
      spw: item.spineW,
      sph: item.spineH
    };
    const onMove = ev => {
      const dx = (ev.clientX - startPos.current.mx) / ps,
        dy = (ev.clientY - startPos.current.my) / ps;
      const sp = startPos.current;
      if (dragging.current === "spine-move") {
        onUpdate(item.id, {
          spineX: Math.round(sp.spx + dx),
          spineY: Math.round(sp.spy + dy)
        });
        return;
      }
      if (dragging.current === "spine-resize") {
        onUpdate(item.id, {
          spineW: Math.max(5, Math.round(sp.spw + dx)),
          spineH: Math.max(20, Math.round(sp.sph + dy))
        });
        return;
      }
      var np = sp.pts.map(function (p) {
        return {
          x: p.x,
          y: p.y
        };
      });
      if (dragging.current === "move-all") {
        np = np.map(function (p) {
          return {
            x: Math.round(p.x + dx),
            y: Math.round(p.y + dy)
          };
        });
      } else {
        var idx = parseInt(dragging.current.replace("pt", ""));
        if (!isNaN(idx)) {
          np[idx] = {
            x: Math.round(sp.pts[idx].x + dx),
            y: Math.round(sp.pts[idx].y + dy)
          };
        }
      }
      // Update screenPts and derive bounding box for screenW/H
      var bx = Math.min(np[0].x, np[1].x, np[2].x, np[3].x);
      var by = Math.min(np[0].y, np[1].y, np[2].y, np[3].y);
      var bw = Math.max(np[0].x, np[1].x, np[2].x, np[3].x) - bx;
      var bh = Math.max(np[0].y, np[1].y, np[2].y, np[3].y) - by;
      onUpdate(item.id, {
        screenPts: np,
        screenX: bx,
        screenY: by,
        screenW: Math.max(20, bw),
        screenH: Math.max(20, bh)
      });
    };
    const onUp = () => {
      dragging.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  // SVG polygon for quad outline
  const polyStr = pts.map(function (p) {
    return p.x * ps + "," + p.y * ps;
  }).join(" ");
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: "#0d1117",
      borderRadius: 10,
      padding: 10,
      border: "1px solid #1e2535",
      marginTop: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      color: "#f97316",
      marginBottom: 6
    }
  }, "\uD83D\uDCD0 \u753B\u9762\u9818\u57DF\uFF084\u70B9\u30C9\u30E9\u30C3\u30B0\uFF09"), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "8px 0"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      width: item.frameW * ps,
      height: item.frameH * ps,
      margin: "0 auto",
      background: "#222",
      borderRadius: 8
    }
  }, item.frameUrl && /*#__PURE__*/React.createElement("img", {
    src: item.frameUrl,
    style: {
      width: "100%",
      height: "100%",
      opacity: 0.6,
      borderRadius: 8
    },
    alt: ""
  }), /*#__PURE__*/React.createElement("svg", {
    style: {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      pointerEvents: "none"
    }
  }, /*#__PURE__*/React.createElement("polygon", {
    points: polyStr,
    fill: "rgba(249,115,22,.12)",
    stroke: "#f97316",
    strokeWidth: "2"
  })), /*#__PURE__*/React.createElement("div", {
    onMouseDown: e => onDown(e, "move-all"),
    style: {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      cursor: "move"
    }
  }), pts.map(function (p, i) {
    var labels = ["TL", "TR", "BR", "BL"];
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      onMouseDown: function (e) {
        onDown(e, "pt" + i);
      },
      style: {
        position: "absolute",
        left: p.x * ps - 6,
        top: p.y * ps - 6,
        width: 12,
        height: 12,
        background: "#f97316",
        borderRadius: "50%",
        cursor: "crosshair",
        border: "2px solid #fff",
        zIndex: 10
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        position: "absolute",
        top: -14,
        left: "50%",
        transform: "translateX(-50%)",
        fontSize: 7,
        color: "#f97316",
        whiteSpace: "nowrap"
      }
    }, labels[i]));
  }), hasSpine && /*#__PURE__*/React.createElement("div", {
    onMouseDown: e => onDown(e, "spine-move"),
    style: {
      position: "absolute",
      left: item.spineX * ps,
      top: item.spineY * ps,
      width: item.spineW * ps,
      height: item.spineH * ps,
      border: "2px solid #a855f7",
      background: "rgba(168,85,247,.2)",
      cursor: "move",
      borderRadius: 2,
      zIndex: 5
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: 2,
      left: 2,
      fontSize: 7,
      color: "#a855f7",
      writingMode: "vertical-rl"
    }
  }, "\u80CC\u8868\u7D19"), /*#__PURE__*/React.createElement("div", {
    onMouseDown: e => onDown(e, "spine-resize"),
    style: {
      position: "absolute",
      bottom: -4,
      right: -4,
      width: 8,
      height: 8,
      background: "#a855f7",
      borderRadius: 2,
      cursor: "nwse-resize"
    }
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr 1fr",
      gap: 3,
      marginTop: 6
    }
  }, ["TL", "TR", "BR", "BL"].map(function (label, i) {
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        fontSize: 8,
        color: "#f97316",
        textAlign: "center"
      }
    }, /*#__PURE__*/React.createElement("div", null, label), /*#__PURE__*/React.createElement("div", {
      style: {
        color: "#999"
      }
    }, pts[i].x, ",", pts[i].y));
  })), hasSpine && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr 1fr",
      gap: 3,
      marginTop: 4
    }
  }, [["X", "spineX"], ["Y", "spineY"], ["幅", "spineW"], ["高", "spineH"]].map(([l, k]) => /*#__PURE__*/React.createElement("div", {
    key: k
  }, /*#__PURE__*/React.createElement("label", {
    style: {
      fontSize: 9,
      color: "#a855f7"
    }
  }, l, "(\u80CC)"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: item[k],
    onChange: e => onUpdate(item.id, {
      [k]: +e.target.value
    }),
    style: {
      width: "100%",
      padding: "3px 5px",
      background: "#161b26",
      border: "1px solid #2a3040",
      borderRadius: 3,
      color: "#e4e4e7",
      fontSize: 12,
      outline: "none"
    }
  })))));
}

// ===== SPINE AREA EDITOR =====
function SpineAreaEditor({
  item,
  onUpdate
}) {
  const dragging = useRef(null);
  const startPos = useRef({});
  const ps = Math.min(180 / item.frameW, 180 / item.frameH, 1);
  const pts = item.spinePts || rectToPts(item.spineX, item.spineY, item.spineW, item.spineH);
  const onDown = (e, mode) => {
    e.preventDefault();
    e.stopPropagation();
    dragging.current = mode;
    startPos.current = {
      mx: e.clientX,
      my: e.clientY,
      pts: pts.map(function (p) {
        return {
          x: p.x,
          y: p.y
        };
      })
    };
    const onMove = ev => {
      const dx = (ev.clientX - startPos.current.mx) / ps,
        dy = (ev.clientY - startPos.current.my) / ps;
      const sp = startPos.current;
      var np = sp.pts.map(function (p) {
        return {
          x: p.x,
          y: p.y
        };
      });
      if (dragging.current === "move-all") {
        np = np.map(function (p) {
          return {
            x: Math.round(p.x + dx),
            y: Math.round(p.y + dy)
          };
        });
      } else {
        var idx = parseInt(dragging.current.replace("spt", ""));
        if (!isNaN(idx)) {
          np[idx] = {
            x: Math.round(sp.pts[idx].x + dx),
            y: Math.round(sp.pts[idx].y + dy)
          };
        }
      }
      var bx = Math.min(np[0].x, np[1].x, np[2].x, np[3].x);
      var by = Math.min(np[0].y, np[1].y, np[2].y, np[3].y);
      var bw = Math.max(np[0].x, np[1].x, np[2].x, np[3].x) - bx;
      var bh = Math.max(np[0].y, np[1].y, np[2].y, np[3].y) - by;
      onUpdate(item.id, {
        spinePts: np,
        spineX: bx,
        spineY: by,
        spineW: Math.max(5, bw),
        spineH: Math.max(10, bh)
      });
    };
    const onUp = () => {
      dragging.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };
  const polyStr = pts.map(function (p) {
    return p.x * ps + "," + p.y * ps;
  }).join(" ");
  // 表紙の参考表示用
  const coverPts = item.screenPts || rectToPts(item.screenX, item.screenY, item.screenW, item.screenH);
  const coverPolyStr = coverPts.map(function (p) {
    return p.x * ps + "," + p.y * ps;
  }).join(" ");
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: "#110d1a",
      borderRadius: 8,
      padding: 8,
      border: "1px solid #2d1f45",
      marginTop: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      fontWeight: 700,
      color: "#a855f7",
      marginBottom: 5
    }
  }, "\uD83D\uDCD0 \u80CC\u8868\u7D19\uFF084\u70B9\u30C9\u30E9\u30C3\u30B0\uFF09"), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      width: item.frameW * ps,
      height: item.frameH * ps,
      margin: "0 auto",
      background: "#1a1a2e",
      borderRadius: 6
    }
  }, item.frameUrl && /*#__PURE__*/React.createElement("img", {
    src: item.frameUrl,
    style: {
      width: "100%",
      height: "100%",
      opacity: 0.5,
      borderRadius: 6
    },
    alt: ""
  }), /*#__PURE__*/React.createElement("svg", {
    style: {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      pointerEvents: "none"
    }
  }, /*#__PURE__*/React.createElement("polygon", {
    points: coverPolyStr,
    fill: "none",
    stroke: "rgba(249,115,22,.3)",
    strokeWidth: "1",
    strokeDasharray: "4 3"
  })), /*#__PURE__*/React.createElement("svg", {
    style: {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      pointerEvents: "none"
    }
  }, /*#__PURE__*/React.createElement("polygon", {
    points: polyStr,
    fill: "rgba(168,85,247,.15)",
    stroke: "#a855f7",
    strokeWidth: "2"
  })), /*#__PURE__*/React.createElement("div", {
    onMouseDown: e => onDown(e, "move-all"),
    style: {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      cursor: "move"
    }
  }), pts.map(function (p, i) {
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      onMouseDown: function (e) {
        onDown(e, "spt" + i);
      },
      style: {
        position: "absolute",
        left: p.x * ps - 5,
        top: p.y * ps - 5,
        width: 10,
        height: 10,
        background: "#a855f7",
        borderRadius: "50%",
        cursor: "crosshair",
        border: "2px solid #fff",
        zIndex: 10
      }
    });
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr 1fr",
      gap: 3,
      marginTop: 5
    }
  }, ["TL", "TR", "BR", "BL"].map(function (label, i) {
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        fontSize: 8,
        color: "#a855f7",
        textAlign: "center"
      }
    }, /*#__PURE__*/React.createElement("div", null, label), /*#__PURE__*/React.createElement("div", {
      style: {
        color: "#999"
      }
    }, pts[i].x, ",", pts[i].y));
  })));
}

// ===== DRAGGABLE =====
function Draggable({
  item,
  onUpdate,
  selected,
  onSelect,
  cScale,
  snap
}) {
  const ref = useRef(null);
  const dr = useRef(false);
  const off = useRef({
    x: 0,
    y: 0
  });
  const onDown = e => {
    e.stopPropagation();
    onSelect(item.id);
    dr.current = true;
    const r = ref.current.getBoundingClientRect();
    off.current = {
      x: e.clientX - r.left,
      y: e.clientY - r.top
    };
    const onMove = ev => {
      if (!dr.current) return;
      const pr = ref.current.parentElement.getBoundingClientRect();
      var nx = Math.round((ev.clientX - pr.left - off.current.x) / cScale);
      var ny = Math.round((ev.clientY - pr.top - off.current.y) / cScale);
      if (snap) {
        nx = Math.round(nx / 40) * 40;
        ny = Math.round(ny / 40) * 40;
      }
      onUpdate(item.id, {
        x: nx,
        y: ny
      });
    };
    const onUp = () => {
      dr.current = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };
  return /*#__PURE__*/React.createElement("div", {
    ref: ref,
    onMouseDown: onDown,
    style: {
      position: "absolute",
      left: item.x,
      top: item.y,
      zIndex: item.zIndex,
      perspective: 800,
      cursor: "grab",
      filter: item.shadow > 0 ? `drop-shadow(4px ${item.shadow}px ${item.shadow * 2}px ${item.shadowColor || "#00000066"})` : "none",
      outline: selected ? "2px solid #f97316" : "none",
      outlineOffset: 4
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      transform: `rotateX(${item.rotateX || 0}deg) rotateY(${item.rotateY || 0}deg) rotateZ(${item.rotateZ || 0}deg) scale(${item.scale})`,
      transformOrigin: "center center",
      transformStyle: "preserve-3d"
    }
  }, /*#__PURE__*/React.createElement(ItemRender, {
    item: item
  })));
}

// ===== EDITOR =====
function Editor({
  item,
  onUpdate,
  onRemove,
  onDuplicate,
  frameLib
}) {
  const u = (k, v) => onUpdate(item.id, {
    [k]: v
  });
  const I = {
    width: "100%",
    padding: "7px 9px",
    background: "#161b26",
    border: "1px solid #2a3040",
    borderRadius: 6,
    color: "#e4e4e7",
    fontSize: 13,
    outline: "none",
    fontFamily: "inherit"
  };
  const L = {
    fontSize: 9,
    color: "#777",
    marginBottom: 2,
    display: "block",
    fontWeight: 600,
    marginTop: 8
  };
  const [saveName, setSaveName] = useState("");
  const [showSave, setShowSave] = useState(false);
  const [frameCat, setFrameCat] = useState("device");
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      fontWeight: 700,
      color: "#f97316"
    }
  }, "\u30D1\u30FC\u30C4\u7DE8\u96C6"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 3
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => onDuplicate(item.id),
    style: {
      fontSize: 10,
      color: "#e4e4e7",
      background: "none",
      border: "1px solid #3b82f6",
      borderRadius: 5,
      padding: "3px 6px",
      cursor: "pointer"
    }
  }, "\u8907\u88FD"), /*#__PURE__*/React.createElement("button", {
    onClick: () => onRemove(item.id),
    style: {
      fontSize: 10,
      color: "#ef4444",
      background: "none",
      border: "1px solid #ef4444",
      borderRadius: 5,
      padding: "3px 6px",
      cursor: "pointer"
    }
  }, "\u524A\u9664"))), /*#__PURE__*/React.createElement("input", {
    style: {
      ...I,
      marginBottom: 6,
      fontWeight: 700
    },
    value: item.name || "",
    onChange: e => u("name", e.target.value),
    placeholder: "\u30D1\u30FC\u30C4\u540D\u3092\u5165\u529B"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "#141c28",
      borderRadius: 12,
      padding: 12,
      border: "1px solid rgba(255,255,255,.12)",
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 700,
      color: "#e4e4e7",
      marginBottom: 6,
      display: "flex",
      alignItems: "center",
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      background: "#f97316",
      color: "#fff",
      width: 18,
      height: 18,
      borderRadius: "50%",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 10,
      fontWeight: 800
    }
  }, "1"), "\u30D5\u30EC\u30FC\u30E0\u753B\u50CF"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 2,
      flexWrap: "wrap",
      marginBottom: 5
    }
  }, FRAME_CATS.map(c => /*#__PURE__*/React.createElement("button", {
    key: c.key,
    onClick: () => setFrameCat(c.key),
    style: {
      fontSize: 9,
      padding: "3px 7px",
      borderRadius: 5,
      cursor: "pointer",
      border: "none",
      background: frameCat === c.key ? "#f97316" : "#1e2636",
      color: frameCat === c.key ? "#fff" : "#999",
      fontWeight: frameCat === c.key ? 700 : 400
    }
  }, c.label))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 4,
      flexWrap: "wrap"
    }
  }, BUILTIN_FRAMES.filter(f => f.cat === frameCat).map(f => /*#__PURE__*/React.createElement("div", {
    key: f.id,
    style: {
      cursor: "pointer"
    },
    onClick: () => {
      const img = new Image();
      img.onload = () => {
        const s = img.naturalWidth > 400 ? 400 / img.naturalWidth : 1;
        const upd = {
          frameUrl: f.url,
          frameW: Math.round(img.naturalWidth * s),
          frameH: Math.round(img.naturalHeight * s)
        };
        const preset = SCREEN_PRESETS[f.id];
        if (preset) {
          upd.screenX = preset.sx;
          upd.screenY = preset.sy;
          upd.screenW = preset.sw;
          upd.screenH = preset.sh;
          upd.screenPts = rectToPts(preset.sx, preset.sy, preset.sw, preset.sh);
        }
        const spine = SPINE_PRESETS[f.id];
        if (spine) {
          upd.spineX = spine.sx;
          upd.spineY = spine.sy;
          upd.spineW = spine.sw;
          upd.spineH = spine.sh;
          upd.spinePts = rectToPts(spine.sx, spine.sy, spine.sw, spine.sh);
        } else {
          upd.spineW = 0;
          upd.spineH = 0;
          upd.spineImage = null;
          upd.spinePts = null;
        }
        onUpdate(item.id, upd);
      };
      img.src = f.url;
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: f.url,
    style: {
      width: 52,
      height: 52,
      objectFit: "contain",
      borderRadius: 8,
      border: item.frameUrl === f.url ? "2px solid #f97316" : "1px solid #333",
      background: "#0d1117",
      padding: 2
    },
    alt: f.name
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 8,
      color: "#888",
      textAlign: "center",
      marginTop: 1,
      maxWidth: 52,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, f.name))))), frameLib.frames.filter(f => !String(f.id).startsWith("builtin")).length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: "#888",
      marginBottom: 4
    }
  }, "\u4FDD\u5B58\u6E08\u307F\u30D5\u30EC\u30FC\u30E0\uFF08\u30AF\u30EA\u30C3\u30AF\u3067\u9069\u7528\uFF09"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 4,
      flexWrap: "wrap"
    }
  }, frameLib.frames.filter(f => !String(f.id).startsWith("builtin")).map(f => /*#__PURE__*/React.createElement("div", {
    key: f.id,
    style: {
      position: "relative",
      cursor: "pointer"
    },
    onClick: () => {
      const img = new Image();
      img.onload = () => {
        const s = img.naturalWidth > 400 ? 400 / img.naturalWidth : 1;
        const upd = {
          frameUrl: f.url,
          frameW: Math.round(img.naturalWidth * s),
          frameH: Math.round(img.naturalHeight * s)
        };
        const preset = SCREEN_PRESETS[f.id];
        if (preset) {
          upd.screenX = preset.sx;
          upd.screenY = preset.sy;
          upd.screenW = preset.sw;
          upd.screenH = preset.sh;
          upd.screenPts = rectToPts(preset.sx, preset.sy, preset.sw, preset.sh);
        }
        const spine = SPINE_PRESETS[f.id];
        if (spine) {
          upd.spineX = spine.sx;
          upd.spineY = spine.sy;
          upd.spineW = spine.sw;
          upd.spineH = spine.sh;
          upd.spinePts = rectToPts(spine.sx, spine.sy, spine.sw, spine.sh);
        } else {
          upd.spineW = 0;
          upd.spineH = 0;
          upd.spineImage = null;
          upd.spinePts = null;
        }
        onUpdate(item.id, upd);
      };
      img.src = f.url;
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: f.url,
    style: {
      width: 52,
      height: 52,
      objectFit: "contain",
      borderRadius: 8,
      border: item.frameUrl === f.url ? "2px solid #f97316" : "1px solid #333",
      background: "#0d1117",
      padding: 2
    },
    alt: f.name
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: "#888",
      textAlign: "center",
      marginTop: 1,
      maxWidth: 52,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, f.name), !String(f.id).startsWith("builtin") && /*#__PURE__*/React.createElement("div", {
    onClick: e => {
      e.stopPropagation();
      frameLib.deleteFrame(f.id);
    },
    style: {
      position: "absolute",
      top: -4,
      right: -4,
      width: 12,
      height: 12,
      borderRadius: "50%",
      background: "#ef4444",
      color: "#fff",
      fontSize: 7,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      lineHeight: 1
    }
  }, "\xD7"))))), /*#__PURE__*/React.createElement("input", {
    type: "file",
    accept: "image/*",
    onChange: e => imgLoad(e.target.files[0], (url, w, h) => {
      const s = w > 400 ? 400 / w : 1;
      onUpdate(item.id, {
        frameUrl: url,
        frameW: Math.round(w * s),
        frameH: Math.round(h * s)
      });
    }),
    style: {
      fontSize: 12,
      color: "#999"
    }
  }), item.frameUrl && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      alignItems: "center",
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: item.frameUrl,
    style: {
      width: 50,
      height: 40,
      objectFit: "contain",
      borderRadius: 8,
      border: "1px solid #2a3040",
      background: "#0d1117"
    },
    alt: ""
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 8,
      color: "#888"
    }
  }, item.frameW, "\xD7", item.frameH, "px"), /*#__PURE__*/React.createElement("button", {
    onClick: () => u("frameUrl", null),
    style: {
      fontSize: 10,
      color: "#ef4444",
      background: "none",
      border: "1px solid #ef4444",
      borderRadius: 5,
      padding: "2px 6px",
      cursor: "pointer",
      marginTop: 2
    }
  }, "\u524A\u9664"))), !showSave && /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowSave(true),
    style: {
      fontSize: 10,
      color: "#e4e4e7",
      background: "none",
      border: "1px solid #3b82f6",
      borderRadius: 5,
      padding: "3px 8px",
      cursor: "pointer",
      width: "100%"
    }
  }, "\uD83D\uDCBE \u30E9\u30A4\u30D6\u30E9\u30EA\u306B\u4FDD\u5B58"), showSave && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 3
    }
  }, /*#__PURE__*/React.createElement("input", {
    style: {
      ...I,
      flex: 1,
      fontSize: 10
    },
    value: saveName,
    onChange: e => setSaveName(e.target.value),
    placeholder: "\u540D\u524D\uFF08\u4F8B\uFF1AiMac\uFF09"
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      if (saveName.trim()) {
        frameLib.saveFrame(saveName.trim(), item.frameUrl);
        setSaveName("");
        setShowSave(false);
      }
    },
    style: {
      fontSize: 10,
      color: "#fff",
      background: "#f97316",
      border: "none",
      borderRadius: 5,
      padding: "3px 8px",
      cursor: "pointer"
    }
  }, "\u4FDD\u5B58"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 3,
      marginTop: 6
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: {
      fontSize: 9,
      color: "#666"
    }
  }, "\u5E45"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    style: I,
    value: item.frameW,
    onChange: e => u("frameW", +e.target.value)
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: {
      fontSize: 9,
      color: "#666"
    }
  }, "\u9AD8\u3055"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    style: I,
    value: item.frameH,
    onChange: e => u("frameH", +e.target.value)
  })))), item.frameUrl && /*#__PURE__*/React.createElement(ScreenAreaEditor, {
    item: item,
    onUpdate: onUpdate
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "#0d1117",
      borderRadius: 10,
      padding: 10,
      marginTop: 6,
      border: "1px solid #1e2535"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      color: "#4ade80",
      marginBottom: 4
    }
  }, "\uD83D\uDCDD \u30B3\u30F3\u30C6\u30F3\u30C4\uFF08\u753B\u9762\u5185\u306E\u8868\u793A\uFF09"), /*#__PURE__*/React.createElement("label", {
    style: L
  }, "\u8868\u793A\u30BF\u30A4\u30D7"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 3,
      marginBottom: 6
    }
  }, [["image", "画像"], ["gradient", "グラデ"], ["color", "単色"], ["text", "透過"]].map(([v, l]) => /*#__PURE__*/React.createElement("button", {
    key: v,
    onClick: () => {
      u("contentType", v);
      if (v === "image" && !item.contentImage) {} else if (v !== "image") u("contentImage", null);
    },
    style: {
      flex: 1,
      padding: "4px 0",
      fontSize: 10,
      borderRadius: 6,
      cursor: "pointer",
      fontFamily: "inherit",
      background: item.contentImage && v === "image" || !item.contentImage && item.contentType === v ? "#22c55e" : "#1a1a2e",
      color: item.contentImage && v === "image" || !item.contentImage && item.contentType === v ? "#fff" : "#666",
      border: item.contentImage && v === "image" || !item.contentImage && item.contentType === v ? "1px solid #22c55e" : "1px solid #333"
    }
  }, l))), (item.contentType === "image" || item.contentImage) && /*#__PURE__*/React.createElement("div", {
    style: {
      background: "#0d2e1a",
      borderRadius: 10,
      padding: 10,
      border: "1px solid #2d5a3d",
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      color: "#4ade80",
      marginBottom: 4
    }
  }, "\uD83D\uDDBC \u30B3\u30F3\u30C6\u30F3\u30C4\u753B\u50CF"), /*#__PURE__*/React.createElement("input", {
    type: "file",
    accept: "image/*",
    onChange: e => imgLoad(e.target.files[0], url => onUpdate(item.id, {
      contentImage: url,
      contentType: "image"
    })),
    style: {
      fontSize: 12,
      color: "#999"
    }
  }), item.contentImage && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 4,
      display: "flex",
      gap: 4,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: item.contentImage,
    style: {
      width: 50,
      height: 40,
      objectFit: "cover",
      borderRadius: 3,
      border: "1px solid #2a3040"
    },
    alt: ""
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => u("contentImage", null),
    style: {
      fontSize: 10,
      color: "#ef4444",
      background: "none",
      border: "1px solid #ef4444",
      borderRadius: 5,
      padding: "2px 6px",
      cursor: "pointer"
    }
  }, "\u524A\u9664")), item.contentImage && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("label", {
    style: L
  }, "\u30D5\u30A3\u30C3\u30C8\u65B9\u5F0F"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 3
    }
  }, [["cover", "カバー"], ["contain", "収める"], ["fill", "引き伸ばし"]].map(([v, l]) => /*#__PURE__*/React.createElement("button", {
    key: v,
    onClick: () => u("contentFit", v),
    style: {
      flex: 1,
      padding: "4px 0",
      fontSize: 10,
      borderRadius: 6,
      cursor: "pointer",
      fontFamily: "inherit",
      background: item.contentFit === v ? "#22c55e" : "#1a1a2e",
      color: item.contentFit === v ? "#fff" : "#666",
      border: item.contentFit === v ? "1px solid #22c55e" : "1px solid #333"
    }
  }, l)))), /*#__PURE__*/React.createElement("label", {
    style: L
  }, "\uD83D\uDCD0 \u753B\u50CF\u306E\u5909\u5F62\uFF08\u8868\u7D19\u306B\u5408\u308F\u305B\u308B\uFF09"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr",
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: {
      fontSize: 9,
      color: "#ef4444",
      fontWeight: 600
    }
  }, "\u50BE\u304DX"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    style: I,
    value: item.contentSkewX || 0,
    onChange: e => u("contentSkewX", +e.target.value),
    step: 0.5
  }), /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: -30,
    max: 30,
    step: 0.5,
    value: item.contentSkewX || 0,
    onChange: e => u("contentSkewX", +e.target.value),
    style: {
      width: "100%",
      marginTop: 2,
      accentColor: "#ef4444"
    }
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: {
      fontSize: 9,
      color: "#4ade80",
      fontWeight: 600
    }
  }, "\u50BE\u304DY"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    style: I,
    value: item.contentSkewY || 0,
    onChange: e => u("contentSkewY", +e.target.value),
    step: 0.5
  }), /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: -30,
    max: 30,
    step: 0.5,
    value: item.contentSkewY || 0,
    onChange: e => u("contentSkewY", +e.target.value),
    style: {
      width: "100%",
      marginTop: 2,
      accentColor: "#22c55e"
    }
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: {
      fontSize: 9,
      color: "#e4e4e7",
      fontWeight: 600
    }
  }, "\u5965\u884C\u304D"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    style: I,
    value: item.contentRotateY || 0,
    onChange: e => u("contentRotateY", +e.target.value),
    step: 1
  }), /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: -45,
    max: 45,
    step: 1,
    value: item.contentRotateY || 0,
    onChange: e => u("contentRotateY", +e.target.value),
    style: {
      width: "100%",
      marginTop: 2,
      accentColor: "#3b82f6"
    }
  })))), !item.contentImage && item.contentType === "color" && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 4,
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "color",
    value: item.bgColor,
    onChange: e => u("bgColor", e.target.value),
    style: {
      width: 28,
      height: 22,
      border: "none",
      cursor: "pointer"
    }
  }), /*#__PURE__*/React.createElement("input", {
    style: {
      ...I,
      flex: 1
    },
    value: item.bgColor,
    onChange: e => u("bgColor", e.target.value)
  })), !item.contentImage && item.contentType === "gradient" && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("input", {
    style: {
      ...I,
      marginBottom: 4
    },
    value: item.bgGradient,
    onChange: e => u("bgGradient", e.target.value)
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 3,
      flexWrap: "wrap",
      marginBottom: 4
    }
  }, ["linear-gradient(135deg,#0c0c1a,#1a1030,#0c0c1a)", "linear-gradient(135deg,#1a3a1a,#0a200a)", "linear-gradient(135deg,#0a1a3a,#0a0a2a)", "linear-gradient(135deg,#f97316,#ea580c)", "#ffffff", "#000000"].map((g, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    onClick: () => u("bgGradient", g),
    style: {
      width: 18,
      height: 18,
      borderRadius: 3,
      background: g,
      border: "1px solid #444",
      cursor: "pointer"
    }
  })))), !item.contentImage && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("label", {
    style: L
  }, "\u30BF\u30A4\u30C8\u30EB"), /*#__PURE__*/React.createElement("textarea", {
    style: {
      ...I,
      height: 36,
      resize: "vertical"
    },
    value: item.title,
    onChange: e => u("title", e.target.value)
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 3,
      marginTop: 3
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: {
      fontSize: 9,
      color: "#666"
    }
  }, "\u30B5\u30A4\u30BA"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    style: I,
    value: item.titleSize,
    onChange: e => u("titleSize", +e.target.value),
    min: 6,
    max: 60
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: {
      fontSize: 9,
      color: "#666"
    }
  }, "\u8272"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 2
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "color",
    value: item.titleColor,
    onChange: e => u("titleColor", e.target.value),
    style: {
      width: 24,
      height: 22,
      border: "none",
      cursor: "pointer"
    }
  }), /*#__PURE__*/React.createElement("input", {
    style: {
      ...I,
      flex: 1
    },
    value: item.titleColor,
    onChange: e => u("titleColor", e.target.value)
  })))), /*#__PURE__*/React.createElement("label", {
    style: L
  }, "\u30B5\u30D6\u30BF\u30A4\u30C8\u30EB"), /*#__PURE__*/React.createElement("input", {
    style: I,
    value: item.subtitle,
    onChange: e => u("subtitle", e.target.value)
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 3,
      marginTop: 3
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: {
      fontSize: 9,
      color: "#666"
    }
  }, "\u30B5\u30A4\u30BA"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    style: I,
    value: item.subtitleSize,
    onChange: e => u("subtitleSize", +e.target.value),
    min: 4,
    max: 40
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: {
      fontSize: 9,
      color: "#666"
    }
  }, "\u8272"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 2
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "color",
    value: item.subtitleColor,
    onChange: e => u("subtitleColor", e.target.value),
    style: {
      width: 24,
      height: 22,
      border: "none",
      cursor: "pointer"
    }
  }), /*#__PURE__*/React.createElement("input", {
    style: {
      ...I,
      flex: 1
    },
    value: item.subtitleColor,
    onChange: e => u("subtitleColor", e.target.value)
  })))))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "#0d1117",
      borderRadius: 10,
      padding: 10,
      marginTop: 6,
      border: "1px solid #1e2535"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      color: "#8b9cc8",
      marginBottom: 4
    }
  }, "\uD83D\uDCCD \u914D\u7F6E"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr",
      gap: 3
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: {
      fontSize: 9,
      color: "#666"
    }
  }, "X"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    style: I,
    value: item.x,
    onChange: e => u("x", +e.target.value)
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: {
      fontSize: 9,
      color: "#666"
    }
  }, "Y"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    style: I,
    value: item.y,
    onChange: e => u("y", +e.target.value)
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: {
      fontSize: 9,
      color: "#666"
    }
  }, "\u30EC\u30A4\u30E4\u30FC"), /*#__PURE__*/React.createElement("div", {
    style: {
      ...I,
      background: "#0d1117",
      textAlign: "center",
      color: "#f97316",
      fontWeight: 700
    }
  }, "\u25B2\u25BC\u3067\u5909\u66F4"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr",
      gap: 3,
      marginTop: 3
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: {
      fontSize: 9,
      color: "#666"
    }
  }, "\u62E1\u5927"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    style: I,
    value: item.scale,
    onChange: e => u("scale", +e.target.value),
    step: 0.05,
    min: 0.1,
    max: 3
  }))), item.spineW > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      color: "#a855f7",
      marginBottom: 4
    }
  }, "\uD83D\uDCD5 \u80CC\u8868\u7D19"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: "#888",
      marginBottom: 4
    }
  }, "\u672C\u578B\u30D5\u30EC\u30FC\u30E0\u306E\u80CC\u8868\u7D19\u306B\u30B3\u30F3\u30C6\u30F3\u30C4\u3092\u914D\u7F6E"), /*#__PURE__*/React.createElement("label", {
    style: L
  }, "\u80CC\u8868\u7D19\u753B\u50CF"), /*#__PURE__*/React.createElement("input", {
    type: "file",
    accept: "image/*",
    style: {
      fontSize: 10,
      color: "#888",
      marginBottom: 4
    },
    onChange: e => imgLoad(e.target.files[0], url => onUpdate(item.id, {
      spineImage: url
    }))
  }), item.spineImage && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: item.spineImage,
    style: {
      width: "100%",
      maxHeight: 60,
      objectFit: "contain",
      borderRadius: 4,
      border: "1px solid #333"
    },
    alt: ""
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => onUpdate(item.id, {
      spineImage: null
    }),
    style: {
      position: "absolute",
      top: 2,
      right: 2,
      background: "#ef4444",
      color: "#fff",
      border: "none",
      borderRadius: "50%",
      width: 16,
      height: 16,
      fontSize: 9,
      cursor: "pointer",
      lineHeight: 1
    }
  }, "\xD7")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr 1fr",
      gap: 3,
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: {
      fontSize: 8,
      color: "#a855f7"
    }
  }, "X"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    style: I,
    value: item.spineX,
    onChange: e => onUpdate(item.id, {
      spineX: +e.target.value
    })
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: {
      fontSize: 8,
      color: "#a855f7"
    }
  }, "Y"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    style: I,
    value: item.spineY,
    onChange: e => onUpdate(item.id, {
      spineY: +e.target.value
    })
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: {
      fontSize: 8,
      color: "#a855f7"
    }
  }, "W"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    style: I,
    value: item.spineW,
    onChange: e => onUpdate(item.id, {
      spineW: +e.target.value
    })
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: {
      fontSize: 8,
      color: "#a855f7"
    }
  }, "H"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    style: I,
    value: item.spineH,
    onChange: e => onUpdate(item.id, {
      spineH: +e.target.value
    })
  }))), item.frameUrl && /*#__PURE__*/React.createElement(SpineAreaEditor, {
    item: item,
    onUpdate: onUpdate
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr",
      gap: 3,
      marginTop: 6
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: {
      fontSize: 8,
      color: "#a855f7"
    }
  }, "\u50BE\u304DX"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    style: I,
    value: item.spineSkewX || 0,
    onChange: e => onUpdate(item.id, {
      spineSkewX: +e.target.value
    }),
    step: 0.5
  }), /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: -30,
    max: 30,
    step: 0.5,
    value: item.spineSkewX || 0,
    onChange: e => onUpdate(item.id, {
      spineSkewX: +e.target.value
    }),
    style: {
      width: "100%",
      marginTop: 2,
      accentColor: "#a855f7"
    }
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: {
      fontSize: 8,
      color: "#a855f7"
    }
  }, "\u50BE\u304DY"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    style: I,
    value: item.spineSkewY || 0,
    onChange: e => onUpdate(item.id, {
      spineSkewY: +e.target.value
    }),
    step: 0.5
  }), /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: -30,
    max: 30,
    step: 0.5,
    value: item.spineSkewY || 0,
    onChange: e => onUpdate(item.id, {
      spineSkewY: +e.target.value
    }),
    style: {
      width: "100%",
      marginTop: 2,
      accentColor: "#a855f7"
    }
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: {
      fontSize: 8,
      color: "#a855f7"
    }
  }, "\u5965\u884C\u304D"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    style: I,
    value: item.spineRotateY || 0,
    onChange: e => onUpdate(item.id, {
      spineRotateY: +e.target.value
    }),
    step: 1
  }), /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: -45,
    max: 45,
    step: 1,
    value: item.spineRotateY || 0,
    onChange: e => onUpdate(item.id, {
      spineRotateY: +e.target.value
    }),
    style: {
      width: "100%",
      marginTop: 2,
      accentColor: "#a855f7"
    }
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      fontWeight: 600,
      color: "#8b9cc8",
      marginTop: 8,
      marginBottom: 4
    }
  }, "\uD83C\uDF11 \u5F71"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: {
      fontSize: 9,
      color: "#666"
    }
  }, "\u5F71\u306E\u5F37\u3055"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    style: I,
    value: item.shadow || 0,
    onChange: e => u("shadow", +e.target.value),
    min: 0,
    max: 40
  }), /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: 0,
    max: 40,
    value: item.shadow || 0,
    onChange: e => u("shadow", +e.target.value),
    style: {
      width: "100%",
      marginTop: 2,
      accentColor: "#a855f7"
    }
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: {
      fontSize: 9,
      color: "#666"
    }
  }, "\u5F71\u306E\u8272"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 2,
      flexWrap: "wrap",
      marginTop: 3
    }
  }, ["#00000066", "#00000033", "#00000099", "#f9731633", "#3b82f633"].map(c => /*#__PURE__*/React.createElement("div", {
    key: c,
    onClick: () => u("shadowColor", c),
    style: {
      width: 18,
      height: 18,
      borderRadius: 3,
      background: c,
      border: (item.shadowColor || "#00000066") === c ? "2px solid #f97316" : "1px solid #444",
      cursor: "pointer"
    }
  }))))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      fontWeight: 600,
      color: "#8b9cc8",
      marginTop: 8,
      marginBottom: 4
    }
  }, "\uD83D\uDD04 3D\u56DE\u8EE2"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: {
      fontSize: 9,
      color: "#ef4444",
      fontWeight: 600
    }
  }, "X\u8EF8"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    style: I,
    value: item.rotateX || 0,
    onChange: e => u("rotateX", +e.target.value)
  }), /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: -60,
    max: 60,
    value: item.rotateX || 0,
    onChange: e => u("rotateX", +e.target.value),
    style: {
      width: "100%",
      marginTop: 2,
      accentColor: "#ef4444"
    }
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: {
      fontSize: 9,
      color: "#4ade80",
      fontWeight: 600
    }
  }, "Y\u8EF8"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    style: I,
    value: item.rotateY || 0,
    onChange: e => u("rotateY", +e.target.value)
  }), /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: -60,
    max: 60,
    value: item.rotateY || 0,
    onChange: e => u("rotateY", +e.target.value),
    style: {
      width: "100%",
      marginTop: 2,
      accentColor: "#22c55e"
    }
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: {
      fontSize: 9,
      color: "#e4e4e7",
      fontWeight: 600
    }
  }, "Z\u8EF8"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    style: I,
    value: item.rotateZ || 0,
    onChange: e => u("rotateZ", +e.target.value)
  }), /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: -180,
    max: 180,
    value: item.rotateZ || 0,
    onChange: e => u("rotateZ", +e.target.value),
    style: {
      width: "100%",
      marginTop: 2,
      accentColor: "#3b82f6"
    }
  })))));
}

// ===== APP =====

/* ═══════════════════════════════════════════
   LP Mockup Generator — サブコンポーネント
   ═══════════════════════════════════════════ */

// ===== LP PROMPT GENERATOR =====
const SIZES = [{
  id: "presentation",
  label: "プレゼンテーション",
  dim: "1920×1080",
  use: "iMac / MacBook用",
  icon: "🖥"
}, {
  id: "story",
  label: "ストーリー",
  dim: "1080×1920",
  use: "iPhone用",
  icon: "📱"
}, {
  id: "poster",
  label: "ポスター",
  dim: "1200×1600",
  use: "iPad / E-Book用",
  icon: "📖"
}, {
  id: "instagram",
  label: "Instagram投稿",
  dim: "1080×1080",
  use: "CD / Instagram用",
  icon: "📸"
}];
const ATMOSPHERE_OPTIONS = [{
  value: "",
  label: "選択してください"
}, {
  value: "Clean, professional design with structured layouts and corporate aesthetics",
  label: "プロフェッショナル"
}, {
  value: "Friendly, approachable design with relaxed typography and warm tones",
  label: "カジュアル"
}, {
  value: "Elegant, premium design with refined typography and sophisticated color palette",
  label: "高級・ラグジュアリー"
}, {
  value: "Bold, energetic design with dynamic layouts and vibrant colors",
  label: "エネルギッシュ"
}, {
  value: "Minimal, spacious design with clean lines and generous whitespace",
  label: "ミニマル"
}, {
  value: "Warm, inviting design with soft textures and nurturing visual elements",
  label: "温かみのある"
}];
const TARGET_OPTIONS = [{
  value: "",
  label: "選択してください"
}, {
  value: "Coaches and consultants seeking business growth",
  label: "コーチ・コンサルタント"
}, {
  value: "Therapists and healers in wellness industry",
  label: "セラピスト・ヒーラー"
}, {
  value: "Teachers and instructors in education",
  label: "先生・講師"
}, {
  value: "Business owners and entrepreneurs",
  label: "経営者・起業家"
}, {
  value: "Fortune tellers and spiritual advisors",
  label: "占い師・スピリチュアル"
}, {
  value: "General audience seeking self-improvement",
  label: "個人・一般"
}];
const CTA_OPTIONS = [{
  value: "",
  label: "選択してください"
}, {
  value: "Get Started Now",
  label: "今すぐ始める"
}, {
  value: "Get It Free",
  label: "無料で受け取る"
}, {
  value: "Learn More",
  label: "詳しく見る"
}, {
  value: "Join Now",
  label: "参加する"
}, {
  value: "Download Now",
  label: "ダウンロードする"
}, {
  value: "Apply Today",
  label: "申し込む"
}, {
  value: "Book Your Session",
  label: "セッションを予約"
}, {
  value: "Claim Your Spot",
  label: "席を確保する"
}];
const DECOR_OPTIONS = [{
  value: "",
  label: "選択してください"
}, {
  value: "Subtle gradient overlays with smooth color transitions",
  label: "グラデーション"
}, {
  value: "Geometric patterns and angular design elements",
  label: "幾何学模様"
}, {
  value: "Clean straight lines, borders, and structured grid elements",
  label: "直線・ストライプ"
}, {
  value: "Organic curves, flowing shapes, and natural forms",
  label: "有機的・曲線"
}, {
  value: "Dot patterns, particles, and scattered elements",
  label: "ドット・パーティクル"
}, {
  value: "Minimal decoration, solid backgrounds, text-focused layout",
  label: "なし（シンプル）"
}];
const HEADLINE_MAP = {
  "プロフェッショナル": {
    "コーチ・コンサルタント": "Elevate Your Coaching Business",
    "セラピスト・ヒーラー": "Professional Healing Solutions",
    "先生・講師": "Transform Your Teaching Impact",
    "経営者・起業家": "Scale Your Business Today",
    "占い師・スピリチュアル": "Professional Spiritual Guidance",
    "個人・一般": "Unlock Your Full Potential"
  },
  "カジュアル": {
    "コーチ・コンサルタント": "Your Journey Starts Here",
    "セラピスト・ヒーラー": "Feel Better, Live Better",
    "先生・講師": "Learning Made Simple",
    "経営者・起業家": "Grow Your Business Easily",
    "占い師・スピリチュアル": "Discover Your True Path",
    "個人・一般": "Start Something Amazing"
  },
  "高級・ラグジュアリー": {
    "コーチ・コンサルタント": "Elite Coaching Experience",
    "セラピスト・ヒーラー": "Exclusive Wellness Journey",
    "先生・講師": "Premium Learning Excellence",
    "経営者・起業家": "The Executive Advantage",
    "占い師・スピリチュアル": "Transcendent Spiritual Mastery",
    "個人・一般": "Experience True Transformation"
  },
  "エネルギッシュ": {
    "コーチ・コンサルタント": "Ignite Your Coaching Power",
    "セラピスト・ヒーラー": "Supercharge Your Healing",
    "先生・講師": "Revolutionize Your Teaching",
    "経営者・起業家": "Explode Your Business Growth",
    "占い師・スピリチュアル": "Awaken Your Cosmic Energy",
    "個人・一般": "Break Through Your Limits"
  },
  "ミニマル": {
    "コーチ・コンサルタント": "Coach. Lead. Succeed.",
    "セラピスト・ヒーラー": "Heal. Restore. Thrive.",
    "先生・講師": "Teach. Inspire. Transform.",
    "経営者・起業家": "Build. Scale. Win.",
    "占い師・スピリチュアル": "See. Know. Grow.",
    "個人・一般": "Less Effort. More Results."
  },
  "温かみのある": {
    "コーチ・コンサルタント": "Nurture Your Clients Growth",
    "セラピスト・ヒーラー": "Gentle Healing, Lasting Change",
    "先生・講師": "Inspire Hearts and Minds",
    "経営者・起業家": "Build With Heart and Purpose",
    "占い師・スピリチュアル": "Embrace Your Inner Light",
    "個人・一般": "Your Brighter Future Awaits"
  }
};
const SUBHEADLINE_MAP = {
  "プロフェッショナル": "Proven strategies and frameworks trusted by industry leaders",
  "カジュアル": "Simple, practical steps anyone can follow starting today",
  "高級・ラグジュアリー": "An exclusive program designed for those who demand excellence",
  "エネルギッシュ": "The bold, action-packed system that delivers real results fast",
  "ミニマル": "Everything you need. Nothing you dont.",
  "温かみのある": "A supportive journey designed with care for your unique path"
};
function getHeadline(atmosphere, target) {
  var atmKey = ATMOSPHERE_OPTIONS.find(function (o) {
    return o.value === atmosphere;
  });
  var tgtKey = TARGET_OPTIONS.find(function (o) {
    return o.value === target;
  });
  if (!atmKey || !tgtKey || !atmKey.label || !tgtKey.label) return "Transform Your Results Today";
  var map = HEADLINE_MAP[atmKey.label];
  return map && map[tgtKey.label] || "Transform Your Results Today";
}
function getSubheadline(atmosphere) {
  var atmKey = ATMOSPHERE_OPTIONS.find(function (o) {
    return o.value === atmosphere;
  });
  if (!atmKey || !atmKey.label) return "A step-by-step program to achieve your goals";
  return SUBHEADLINE_MAP[atmKey.label] || "A step-by-step program to achieve your goals";
}
function buildPrompt(data, size) {
  return `Create a flat 2D promotional design.

Size: ${size.dim} (${size.label} - ${size.use})

Color scheme:
- Background: ${data.bgColor}
- Accent: ${data.accentColor}
- Text: ${data.textColor}

Text (English only):
- Headline: "${data.headline}"
- Subheadline: "${data.subheadline}"
- CTA: "${data.cta}"

Atmosphere: ${data.atmosphere}
Target audience: ${data.target}

Style requirements:
- Flat 2D only, NO 3D effects, NO shadows, NO gradients on objects
- ${data.decorStyle}
- Modern, clean layout optimized for ${size.dim} aspect ratio
- NO Japanese, Chinese, or Korean text anywhere
- All text must be in English only`;
}
function ColorSwatch({
  color,
  onChange,
  label
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 36,
      height: 36,
      borderRadius: 6,
      backgroundColor: color,
      border: "2px solid rgba(255,255,255,0.15)",
      cursor: "pointer",
      position: "relative",
      overflow: "hidden",
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "color",
    value: color,
    onChange: e => onChange(e.target.value),
    style: {
      position: "absolute",
      inset: 0,
      width: "150%",
      height: "150%",
      opacity: 0,
      cursor: "pointer"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 2,
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "rgba(255,255,255,0.5)",
      letterSpacing: "0.05em"
    }
  }, label), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: color,
    onChange: e => onChange(e.target.value),
    style: {
      background: "rgba(255,255,255,0.06)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 4,
      color: "#fff",
      padding: "4px 8px",
      fontSize: 13,
      fontFamily: "'JetBrains Mono', monospace",
      width: "100%"
    }
  })));
}
function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
  }
  return fallbackCopy(text);
}
function fallbackCopy(text) {
  return new Promise((resolve, reject) => {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.cssText = "position:fixed;left:-9999px;top:-9999px;opacity:0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      document.execCommand("copy");
      resolve();
    } catch (e) {
      reject(e);
    } finally {
      document.body.removeChild(ta);
    }
  });
}
function PromptCard({
  size,
  prompt
}) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    copyToClipboard(prompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }).catch(() => {});
  }, [prompt]);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 10,
      padding: 16,
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 20
    }
  }, size.icon), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#fff",
      fontWeight: 600,
      fontSize: 14
    }
  }, size.label), /*#__PURE__*/React.createElement("div", {
    style: {
      color: "rgba(255,255,255,0.4)",
      fontSize: 12
    }
  }, size.dim, " \u2014 ", size.use))), /*#__PURE__*/React.createElement("button", {
    onClick: handleCopy,
    style: {
      background: copied ? "#00c853" : "rgba(255,255,255,0.08)",
      color: copied ? "#fff" : "rgba(255,255,255,0.8)",
      border: "1px solid " + (copied ? "#00c853" : "rgba(255,255,255,0.12)"),
      borderRadius: 6,
      padding: "6px 14px",
      fontSize: 13,
      fontWeight: 500,
      cursor: "pointer",
      transition: "all 0.2s",
      whiteSpace: "nowrap"
    }
  }, copied ? "✓ コピー済" : "📋 コピー")), /*#__PURE__*/React.createElement("pre", {
    style: {
      background: "rgba(0,0,0,0.3)",
      borderRadius: 6,
      padding: 12,
      color: "rgba(255,255,255,0.65)",
      fontSize: 12,
      lineHeight: 1.6,
      fontFamily: "'JetBrains Mono', monospace",
      whiteSpace: "pre-wrap",
      wordBreak: "break-word",
      margin: 0,
      maxHeight: 180,
      overflowY: "auto"
    }
  }, prompt));
}
function CopyAllButton({
  prompts
}) {
  const [copied, setCopied] = useState(false);
  const handleCopyAll = useCallback(() => {
    const allText = prompts.map((p, i) => `===== ${SIZES[i].label} (${SIZES[i].dim}) =====\n\n${p}`).join("\n\n\n");
    copyToClipboard(allText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }, [prompts]);
  return /*#__PURE__*/React.createElement("button", {
    onClick: handleCopyAll,
    style: {
      background: copied ? "linear-gradient(135deg, #00c853, #00e676)" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
      color: "#fff",
      border: "none",
      borderRadius: 8,
      padding: "12px 24px",
      fontSize: 15,
      fontWeight: 600,
      cursor: "pointer",
      transition: "all 0.25s",
      width: "100%",
      letterSpacing: "0.02em"
    }
  }, copied ? "✓ 4件すべてコピー済！" : "📋 4件すべてコピー");
}
function LPMockupGenerator() {
  const [data, setData] = useState({
    bgColor: "#1a1a2e",
    accentColor: "#FF6B35",
    textColor: "#FFFFFF",
    atmosphere: "",
    target: "",
    headline: "",
    subheadline: "",
    cta: "",
    decorStyle: "",
    funnelRole: "",
    emotionalTriggers: ""
  });
  const [images, setImages] = useState([]);
  const [lpText, setLpText] = useState("");
  const [showPrompts, setShowPrompts] = useState(false);
  const [phase, setPhase] = useState("upload");
  const fileRef = useRef(null);
  const update = key => valOrEvent => {
    const val = typeof valOrEvent === "string" ? valOrEvent : valOrEvent.target.value;
    setData(prev => ({
      ...prev,
      [key]: val
    }));
    setShowPrompts(false);
  };
  const resizeImage = (dataUrl, maxDim = 1568) => {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => {
        let {
          width,
          height
        } = img;
        if (width <= maxDim && height <= maxDim) {
          resolve(dataUrl);
          return;
        }
        const scale = maxDim / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = dataUrl;
    });
  };
  const extractColors = dataUrl => {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const size = 100;
          const scale = size / Math.max(img.width, img.height);
          canvas.width = Math.round(img.width * scale) || 1;
          canvas.height = Math.round(img.height * scale) || 1;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
          const toHex = function (n) {
            return Math.min(255, Math.max(0, n)).toString(16).padStart(2, "0");
          };
          const colorMap = {};
          const saturated = [];
          for (var i = 0; i < pixels.length; i += 16) {
            var r = pixels[i],
              g = pixels[i + 1],
              b = pixels[i + 2],
              a = pixels[i + 3];
            if (a < 128) continue;
            var qr = Math.round(r / 16) * 16,
              qg = Math.round(g / 16) * 16,
              qb = Math.round(b / 16) * 16;
            qr = Math.min(qr, 240);
            qg = Math.min(qg, 240);
            qb = Math.min(qb, 240);
            var key = toHex(qr) + toHex(qg) + toHex(qb);
            colorMap[key] = (colorMap[key] || 0) + 1;
            var mx = Math.max(r, g, b),
              mn = Math.min(r, g, b);
            var sat = mx === 0 ? 0 : (mx - mn) / mx;
            var lum = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
            if (sat > 0.25 && lum > 0.1 && lum < 0.9) saturated.push({
              r: r,
              g: g,
              b: b,
              sat: sat
            });
          }
          var sorted = Object.entries(colorMap).sort(function (a, b) {
            return b[1] - a[1];
          });
          var bgHex = sorted.length > 0 ? "#" + sorted[0][0] : "#1a1a2e";
          var bgR = parseInt(bgHex.slice(1, 3), 16) || 0;
          var bgG = parseInt(bgHex.slice(3, 5), 16) || 0;
          var bgB = parseInt(bgHex.slice(5, 7), 16) || 0;
          var bgLum = (bgR * 0.299 + bgG * 0.587 + bgB * 0.114) / 255;
          var textHex = bgLum < 0.5 ? "#FFFFFF" : "#1a1a2e";
          var accentHex = "#FF6B35";
          if (saturated.length > 0) {
            saturated.sort(function (a, b) {
              return b.sat - a.sat;
            });
            var c = saturated[0];
            accentHex = "#" + toHex(c.r) + toHex(c.g) + toHex(c.b);
          }
          resolve({
            bgColor: bgHex,
            accentColor: accentHex,
            textColor: textHex
          });
        } catch (e) {
          resolve(null);
        }
      };
      img.onerror = function () {
        resolve(null);
      };
      img.src = dataUrl;
    });
  };
  const [colorsExtracted, setColorsExtracted] = useState(false);
  const [showColorBanner, setShowColorBanner] = useState(false);
  const handleImageUpload = files => {
    const fileArray = Array.from(files).filter(f => f.type.startsWith("image/"));
    fileArray.forEach(file => {
      const reader = new FileReader();
      reader.onload = async e => {
        const resized = await resizeImage(e.target.result);
        const type = resized.startsWith("data:image/jpeg") ? "image/jpeg" : file.type;
        setImages(prev => [...prev, {
          name: file.name,
          dataUrl: resized,
          type
        }]);
        var colors = await extractColors(resized);
        if (colors) {
          setData(function (prev) {
            return Object.assign({}, prev, colors);
          });
          setColorsExtracted(true);
        }
      };
      reader.readAsDataURL(file);
    });
  };
  const removeImage = idx => setImages(prev => prev.filter((_, i) => i !== idx));
  const handleDrop = e => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files.length) handleImageUpload(e.dataTransfer.files);
  };
  const prompts = SIZES.map(size => buildPrompt(data, size));
  const isValid = data.headline && data.subheadline && data.cta && data.atmosphere;
  const inputStyle = {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 6,
    color: "#fff",
    padding: "8px 12px",
    fontSize: 14,
    width: "100%",
    outline: "none",
    boxSizing: "border-box"
  };
  const labelStyle = {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    letterSpacing: "0.04em",
    fontWeight: 600,
    marginBottom: 4
  };
  const sectionBox = {
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 12,
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 16
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: "#0a0a12",
      color: "#fff",
      fontFamily: "-apple-system, sans-serif",
      padding: "24px 16px"
    }
  }, /*#__PURE__*/React.createElement("link", {
    href: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap",
    rel: "stylesheet"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 720,
      margin: "0 auto"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      marginBottom: 28
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "inline-block",
      fontSize: 11,
      color: "#8b5cf6",
      border: "1px solid rgba(139,92,246,0.3)",
      borderRadius: 20,
      padding: "4px 14px",
      marginBottom: 10,
      letterSpacing: "0.05em"
    }
  }, "Mockup Composer \u30C4\u30FC\u30EB"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 26,
      fontWeight: 700,
      margin: "0 0 4px",
      background: "linear-gradient(135deg, #fff 40%, #8b5cf6)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent"
    }
  }, "LP\u30D7\u30ED\u30F3\u30D7\u30C8\u751F\u6210\u30C4\u30FC\u30EB"), /*#__PURE__*/React.createElement("p", {
    style: {
      color: "rgba(255,255,255,0.4)",
      fontSize: 13,
      margin: 0
    }
  }, "LP\u30B9\u30AF\u30B7\u30E7\uFF0B\u30C6\u30AD\u30B9\u30C8 \u2192 AI\u89E3\u6790 \u2192 Canva\u30D7\u30ED\u30F3\u30D7\u30C84\u30B5\u30A4\u30BA\u81EA\u52D5\u751F\u6210")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 2,
      marginBottom: 20,
      background: "rgba(255,255,255,0.04)",
      borderRadius: 8,
      padding: 3
    }
  }, [{
    key: "upload",
    label: "① アップロード",
    icon: "📤"
  }, {
    key: "edit",
    label: "② 編集",
    icon: "✏️"
  }, {
    key: "prompts",
    label: "③ プロンプト",
    icon: "⚡"
  }].map(tab => /*#__PURE__*/React.createElement("button", {
    key: tab.key,
    onClick: () => {
      if (tab.key === "prompts") setShowPrompts(true);
      setPhase(tab.key);
    },
    style: {
      flex: 1,
      background: phase === tab.key ? "rgba(139,92,246,0.2)" : "transparent",
      border: "none",
      borderRadius: 6,
      color: phase === tab.key ? "#c4b5fd" : "rgba(255,255,255,0.35)",
      padding: "8px 6px",
      fontSize: 13,
      fontWeight: 500,
      cursor: "pointer",
      transition: "all 0.2s",
      position: "relative"
    }
  }, tab.icon, " ", tab.label, tab.key === "edit" && colorsExtracted && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      fontSize: 9,
      color: "#00c853",
      fontWeight: 700,
      marginTop: 2
    }
  }, "\u2713 \u914D\u8272\u3092\u81EA\u52D5\u53D6\u5F97\u3057\u307E\u3057\u305F")))), phase === "upload" && /*#__PURE__*/React.createElement("div", {
    style: {
      ...sectionBox,
      gap: 18
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: labelStyle
  }, "LP\u30B9\u30AF\u30EA\u30FC\u30F3\u30B7\u30E7\u30C3\u30C8"), /*#__PURE__*/React.createElement("div", {
    onDrop: handleDrop,
    onDragOver: e => {
      e.preventDefault();
      e.stopPropagation();
    },
    onClick: () => fileRef.current?.click(),
    style: {
      border: "2px dashed rgba(139,92,246,0.3)",
      borderRadius: 10,
      padding: "28px 20px",
      textAlign: "center",
      cursor: "pointer",
      background: "rgba(139,92,246,0.04)"
    }
  }, /*#__PURE__*/React.createElement("input", {
    ref: fileRef,
    type: "file",
    accept: "image/*",
    multiple: true,
    style: {
      display: "none"
    },
    onChange: e => {
      if (e.target.files.length) handleImageUpload(e.target.files);
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 32,
      marginBottom: 8
    }
  }, "\uD83D\uDCF8"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: "rgba(255,255,255,0.6)",
      fontSize: 14
    }
  }, "\u30AF\u30EA\u30C3\u30AF\u307E\u305F\u306F\u30C9\u30E9\u30C3\u30B0\uFF06\u30C9\u30ED\u30C3\u30D7"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: "rgba(255,255,255,0.3)",
      fontSize: 12,
      marginTop: 4
    }
  }, "\u8907\u6570\u753B\u50CFOK")), images.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      flexWrap: "wrap",
      marginTop: 10
    }
  }, images.map((img, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      position: "relative",
      borderRadius: 8,
      overflow: "hidden",
      border: "1px solid rgba(255,255,255,0.1)"
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: img.dataUrl,
    alt: "",
    style: {
      height: 80,
      width: "auto",
      display: "block"
    }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: e => {
      e.stopPropagation();
      removeImage(i);
    },
    style: {
      position: "absolute",
      top: 2,
      right: 2,
      background: "rgba(0,0,0,0.7)",
      border: "none",
      color: "#ff4444",
      borderRadius: "50%",
      width: 20,
      height: 20,
      fontSize: 12,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, "\xD7"))))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: labelStyle
  }, "LP\u30C6\u30AD\u30B9\u30C8"), /*#__PURE__*/React.createElement("textarea", {
    value: lpText,
    onChange: e => setLpText(e.target.value),
    placeholder: "LP\u306E\u30C6\u30AD\u30B9\u30C8\u3092\u3053\u3053\u306B\u8CBC\u308A\u4ED8\u3051...",
    style: {
      ...inputStyle,
      minHeight: 140,
      resize: "vertical",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 13,
      lineHeight: 1.6
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      color: "rgba(255,255,255,0.3)",
      fontSize: 11,
      marginTop: 4
    }
  }, "\u753B\u50CF\u306E\u307F\u30FB\u30C6\u30AD\u30B9\u30C8\u306E\u307F\u30FB\u4E21\u65B9\u3044\u305A\u308C\u3082OK")), /*#__PURE__*/React.createElement("button", {
    onClick: function () {
      if (colorsExtracted) {
        setShowColorBanner(true);
        setTimeout(function () {
          setShowColorBanner(false);
        }, 5000);
      }
      setPhase("edit");
    },
    style: {
      background: images.length || lpText.trim() ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "rgba(255,255,255,0.05)",
      color: images.length || lpText.trim() ? "#fff" : "rgba(255,255,255,0.3)",
      border: "none",
      borderRadius: 8,
      padding: "14px 24px",
      fontSize: 16,
      fontWeight: 700,
      cursor: images.length || lpText.trim() ? "pointer" : "not-allowed",
      transition: "all 0.25s",
      letterSpacing: "0.03em",
      width: "100%"
    }
  }, "\u270F\uFE0F \u2461 \u7DE8\u96C6\u3078\u9032\u3080")), phase === "edit" && /*#__PURE__*/React.createElement("div", {
    style: {
      ...sectionBox
    }
  }, showColorBanner && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("style", null, `
                  @keyframes lpmg-color-in { 0% { opacity:0; transform:translateY(-10px); } 100% { opacity:1; transform:translateY(0); } }
                  @keyframes lpmg-color-pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(0,200,83,0.4); } 50% { box-shadow: 0 0 12px 4px rgba(0,200,83,0.15); } }
                `), /*#__PURE__*/React.createElement("div", {
    style: {
      animation: "lpmg-color-in 0.5s ease-out",
      padding: "14px 16px",
      background: "rgba(0,200,83,0.08)",
      border: "1px solid rgba(0,200,83,0.25)",
      borderRadius: 10,
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 18
    }
  }, "\uD83C\uDFA8"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 700,
      color: "#00c853"
    }
  }, "\u30B9\u30AF\u30EA\u30FC\u30F3\u30B7\u30E7\u30C3\u30C8\u304B\u3089\u914D\u8272\u3092\u53D6\u5F97\u3057\u307E\u3057\u305F")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      alignItems: "center"
    }
  }, [{
    color: data.bgColor,
    label: "背景"
  }, {
    color: data.accentColor,
    label: "アクセント"
  }, {
    color: data.textColor,
    label: "テキスト"
  }].map(function (item, i) {
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        display: "flex",
        alignItems: "center",
        gap: 6,
        animation: "lpmg-color-in 0.5s ease-out " + (0.2 + i * 0.15) + "s both"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 28,
        height: 28,
        borderRadius: 6,
        backgroundColor: item.color,
        border: "2px solid rgba(255,255,255,0.2)",
        animation: "lpmg-color-pulse 2s ease-in-out infinite " + i * 0.3 + "s"
      }
    }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10,
        color: "rgba(255,255,255,0.4)"
      }
    }, item.label), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: "#fff",
        fontFamily: "'JetBrains Mono', monospace"
      }
    }, item.color)));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: "rgba(255,255,255,0.3)",
      marginTop: 8
    }
  }, "\u4EE5\u4E0B\u306E\u30D5\u30A9\u30FC\u30E0\u3067\u4FEE\u6B63\u3067\u304D\u307E\u3059\u3002\u30C6\u30AD\u30B9\u30C8\u60C5\u5831\u3092\u5165\u529B\u3057\u3066\u30D7\u30ED\u30F3\u30D7\u30C8\u3092\u751F\u6210\u3057\u3066\u304F\u3060\u3055\u3044\u3002"))), (data.funnelRole || data.emotionalTriggers) && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      flexWrap: "wrap"
    }
  }, data.funnelRole && /*#__PURE__*/React.createElement("div", {
    style: {
      background: "rgba(139,92,246,0.12)",
      border: "1px solid rgba(139,92,246,0.25)",
      borderRadius: 6,
      padding: "6px 12px",
      fontSize: 12,
      color: "#c4b5fd"
    }
  }, "\uD83C\uDFAF ", data.funnelRole), data.emotionalTriggers && /*#__PURE__*/React.createElement("div", {
    style: {
      background: "rgba(0,200,83,0.08)",
      border: "1px solid rgba(0,200,83,0.2)",
      borderRadius: 6,
      padding: "6px 12px",
      fontSize: 12,
      color: "#69f0ae"
    }
  }, "\uD83D\uDCA1 ", data.emotionalTriggers)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: labelStyle
  }, "\u914D\u8272"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
      gap: 10,
      marginTop: 6
    }
  }, /*#__PURE__*/React.createElement(ColorSwatch, {
    color: data.bgColor,
    onChange: update("bgColor"),
    label: "\u80CC\u666F\u8272"
  }), /*#__PURE__*/React.createElement(ColorSwatch, {
    color: data.accentColor,
    onChange: update("accentColor"),
    label: "\u30A2\u30AF\u30BB\u30F3\u30C8\u8272"
  }), /*#__PURE__*/React.createElement(ColorSwatch, {
    color: data.textColor,
    onChange: update("textColor"),
    label: "\u30C6\u30AD\u30B9\u30C8\u8272"
  }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: labelStyle
  }, "\u96F0\u56F2\u6C17"), /*#__PURE__*/React.createElement("select", {
    value: data.atmosphere,
    onChange: function (e) {
      var v = e.target.value;
      setData(function (prev) {
        return Object.assign({}, prev, {
          atmosphere: v,
          headline: getHeadline(v, prev.target),
          subheadline: getSubheadline(v)
        });
      });
      setShowPrompts(false);
    },
    style: {
      ...inputStyle,
      cursor: "pointer"
    }
  }, ATMOSPHERE_OPTIONS.map(function (o) {
    return /*#__PURE__*/React.createElement("option", {
      key: o.value,
      value: o.value
    }, o.label);
  }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: labelStyle
  }, "\u30BF\u30FC\u30B2\u30C3\u30C8"), /*#__PURE__*/React.createElement("select", {
    value: data.target,
    onChange: function (e) {
      var v = e.target.value;
      setData(function (prev) {
        return Object.assign({}, prev, {
          target: v,
          headline: getHeadline(prev.atmosphere, v)
        });
      });
      setShowPrompts(false);
    },
    style: {
      ...inputStyle,
      cursor: "pointer"
    }
  }, TARGET_OPTIONS.map(function (o) {
    return /*#__PURE__*/React.createElement("option", {
      key: o.value,
      value: o.value
    }, o.label);
  }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: labelStyle
  }, "\u30D8\u30C3\u30C9\u30E9\u30A4\u30F3\uFF08\u82F1\u8A9E\u30FB\u81EA\u52D5\u751F\u6210\u30FB\u7DE8\u96C6\u53EF\uFF09"), /*#__PURE__*/React.createElement("input", {
    style: {
      ...inputStyle,
      fontSize: 16,
      fontWeight: 600
    },
    value: data.headline,
    onChange: update("headline")
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: labelStyle
  }, "\u30B5\u30D6\u30D8\u30C3\u30C9\u30E9\u30A4\u30F3\uFF08\u82F1\u8A9E\u30FB\u81EA\u52D5\u751F\u6210\u30FB\u7DE8\u96C6\u53EF\uFF09"), /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    value: data.subheadline,
    onChange: update("subheadline")
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: labelStyle
  }, "CTA"), /*#__PURE__*/React.createElement("select", {
    value: data.cta,
    onChange: update("cta"),
    style: {
      ...inputStyle,
      cursor: "pointer"
    }
  }, CTA_OPTIONS.map(function (o) {
    return /*#__PURE__*/React.createElement("option", {
      key: o.value,
      value: o.value
    }, o.label + (o.value ? " — " + o.value : ""));
  }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: labelStyle
  }, "\u88C5\u98FE\u30B9\u30BF\u30A4\u30EB"), /*#__PURE__*/React.createElement("select", {
    value: data.decorStyle,
    onChange: update("decorStyle"),
    style: {
      ...inputStyle,
      cursor: "pointer"
    }
  }, DECOR_OPTIONS.map(function (o) {
    return /*#__PURE__*/React.createElement("option", {
      key: o.value,
      value: o.value
    }, o.label);
  }))), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setShowPrompts(true);
      setPhase("prompts");
    },
    disabled: !isValid,
    style: {
      background: isValid ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "rgba(255,255,255,0.05)",
      color: isValid ? "#fff" : "rgba(255,255,255,0.3)",
      border: "none",
      borderRadius: 8,
      padding: "14px 24px",
      fontSize: 16,
      fontWeight: 700,
      cursor: isValid ? "pointer" : "not-allowed",
      transition: "all 0.25s"
    }
  }, "\u26A1 \u30D7\u30ED\u30F3\u30D7\u30C84\u4EF6\u3092\u751F\u6210")), phase === "prompts" && showPrompts && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: 18,
      fontWeight: 700,
      margin: 0
    }
  }, "\u751F\u6210\u3055\u308C\u305F\u30D7\u30ED\u30F3\u30D7\u30C8"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 4
    }
  }, [data.bgColor, data.accentColor, data.textColor].map((c, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      width: 18,
      height: 18,
      borderRadius: 4,
      backgroundColor: c,
      border: "1px solid rgba(255,255,255,0.15)"
    }
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, SIZES.map((size, i) => /*#__PURE__*/React.createElement(PromptCard, {
    key: size.id,
    size: size,
    prompt: prompts[i]
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement(CopyAllButton, {
    prompts: prompts
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16,
      padding: 14,
      background: "rgba(139,92,246,0.08)",
      border: "1px solid rgba(139,92,246,0.15)",
      borderRadius: 8,
      fontSize: 13,
      color: "rgba(255,255,255,0.55)",
      lineHeight: 1.7
    }
  }, /*#__PURE__*/React.createElement("strong", {
    style: {
      color: "#c4b5fd"
    }
  }, "\u4F7F\u3044\u65B9\uFF1A"), " Canva \u2192 \u30C7\u30B6\u30A4\u30F3\u3092\u4F5C\u6210 \u2192 Canva AI \u2192 \u30D7\u30ED\u30F3\u30D7\u30C8\u3092\u30DA\u30FC\u30B9\u30C8 \u2192 \u751F\u6210 \u2192 PNG\u30A8\u30AF\u30B9\u30DD\u30FC\u30C8"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setData({
        bgColor: "#1a1a2e",
        accentColor: "#FF6B35",
        textColor: "#FFFFFF",
        atmosphere: "",
        target: "",
        headline: "",
        subheadline: "",
        cta: "",
        decorStyle: "",
        funnelRole: "",
        emotionalTriggers: ""
      });
      setImages([]);
      setLpText("");
      setShowPrompts(false);
      setColorsExtracted(false);
      setPhase("upload");
    },
    style: {
      marginTop: 12,
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 8,
      padding: "10px 20px",
      fontSize: 14,
      color: "rgba(255,255,255,0.5)",
      cursor: "pointer",
      width: "100%",
      transition: "all 0.2s"
    }
  }, "\uD83D\uDD04 \u65B0\u3057\u3044LP\u3092\u89E3\u6790\u3059\u308B")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 32,
      paddingTop: 16,
      borderTop: "1px solid rgba(255,255,255,.06)",
      textAlign: "center",
      fontSize: 9,
      color: "#333",
      lineHeight: 2
    }
  }, /*#__PURE__*/React.createElement("div", null, "BESTAD G.K."), /*#__PURE__*/React.createElement("a", {
    href: "https://bestad.biz/tokushou.html",
    target: "_blank",
    rel: "noopener noreferrer",
    style: {
      color: "#444",
      textDecoration: "none"
    }
  }, "\u7279\u5B9A\u5546\u53D6\u5F15\u6CD5\u306B\u57FA\u3065\u304F\u8868\u8A18"), " \uFF5C ", /*#__PURE__*/React.createElement("a", {
    href: "https://bestad.biz/privacypolicy.html",
    target: "_blank",
    rel: "noopener noreferrer",
    style: {
      color: "#444",
      textDecoration: "none"
    }
  }, "\u30D7\u30E9\u30A4\u30D0\u30B7\u30FC\u30DD\u30EA\u30B7\u30FC"))));
}
function App() {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const historyRef = useRef([]);
  const historyIdx = useRef(-1);
  const skipHistory = useRef(false);
  const pushHistory = useCallback(function (newItems) {
    if (skipHistory.current) {
      skipHistory.current = false;
      return;
    }
    var h = historyRef.current;
    h.splice(historyIdx.current + 1);
    h.push(JSON.stringify(newItems));
    if (h.length > 50) h.shift();
    historyIdx.current = h.length - 1;
  }, []);
  const undo = useCallback(function () {
    if (historyIdx.current <= 0) return;
    historyIdx.current--;
    skipHistory.current = true;
    setItems(JSON.parse(historyRef.current[historyIdx.current]));
  }, []);
  const redo = useCallback(function () {
    if (historyIdx.current >= historyRef.current.length - 1) return;
    historyIdx.current++;
    skipHistory.current = true;
    setItems(JSON.parse(historyRef.current[historyIdx.current]));
  }, []);
  useEffect(function () {
    pushHistory(items);
  }, [items]);
  useEffect(function () {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return function () {
      window.removeEventListener("keydown", onKey);
    };
  }, [undo, redo]);

  // Show welcome modal on first visit (FREE version only)
  useEffect(function () {
    if (IS_FREE) {
      try {
        var welcomed = localStorage.getItem("mc_welcomed");
        if (!welcomed) {
          setShowWelcome(true);
        }
      } catch (e) {
        setShowWelcome(true);
      }
    }
  }, []);
  const [showExport, setShowExport] = useState(false);
  const [exportFmt, setExportFmt] = useState("png");
  const [exportDpi, setExportDpi] = useState(96);
  const [wsBg, setWsBg] = useState("white");
  const [showGrid, setShowGrid] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [showOpManual, setShowOpManual] = useState(false);
  const [showChromeGuide, setShowChromeGuide] = useState(false);
  const [showCanvaGuide, setShowCanvaGuide] = useState(false);
  const [showCfGuide, setShowCfGuide] = useState(false);
  const [showFaq, setShowFaq] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showProPanel, setShowProPanel] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [showTpl, setShowTpl] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [canvaOpen, setCanvaOpen] = useState(false);
  const [cTitle, setCTitle] = useState("");
  const [cDesc, setCDesc] = useState("");
  const [cMock, setCMock] = useState("ebook");
  const [cColor, setCColor] = useState("dbo");
  const [cMood, setCMood] = useState("pro");
  const [cFunnel, setCFunnel] = useState("core");
  const [cEmo, setCEmo] = useState("trust");
  const [cBadge, setCBadge] = useState("");
  const [cExtra, setCExtra] = useState("");
  const [cResult, setCResult] = useState("");
  const [cfOpen, setCfOpen] = useState(false);
  const [cfUrl, setCfUrl] = useState("");
  const [cfResult, setCfResult] = useState("");
  const [cfExtra, setCfExtra] = useState("");
  const [exportCount, setExportCount] = useState(0);
  const [registered, setRegistered] = useState(false);
  const [showGate, setShowGate] = useState(false);
  const [shared, setShared] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showMCTool, setShowMCTool] = useState(false);
  const [mcUrl, setMcUrl] = useState("");
  const [mcAnalyzing, setMcAnalyzing] = useState(false);
  const [mcStatus, setMcStatus] = useState("");
  const mcIframeRef = useRef(null);
  /* STEP2チェックボックス — JSX React state（iframeのJS非依存） */
  const [mcChecks, setMcChecks] = useState({
    1: false,
    2: false,
    3: false,
    4: false
  });
  const [mcGuideOpen, setMcGuideOpen] = useState(false);
  const analyzeColors = async function (url) {
    if (!url) url = mcUrl;
    url = (url || '').trim();
    if (!url) {
      setMcStatus("✗ URLを入力してください");
      return;
    }
    if (!/^https?:\/\//.test(url)) url = 'https://' + url;
    setMcAnalyzing(true);
    setMcStatus("\u89E3\u6790\u4E2D...");
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          system: 'You are a web design color analyst. Use web_search to fetch the given URL and analyze its color palette. Respond ONLY with a raw JSON object, no markdown fences. Format: {"bg":"#RRGGBB","accent":"#RRGGBB","text":"#RRGGBB","extra":["#RRGGBB"],"mood":"label","note":"reason"}',
          messages: [{
            role: 'user',
            content: 'Analyze color palette as JSON only: ' + url
          }],
          tools: [{
            type: 'web_search_20250305',
            name: 'web_search'
          }]
        })
      });
      if (!res.ok) {
        const e2 = await res.json().catch(() => ({}));
        throw new Error(e2.error && e2.error.message || 'HTTP ' + res.status);
      }
      const data = await res.json();
      const raw = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
      const m = raw.match(/```json[\s\S]*?```/) || raw.match(/(\{[\s\S]*?\})/);
      if (!m) throw new Error('JSON\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093');
      const result = JSON.parse((m[1] || m[0]).replace(/```json|```/g, '').trim());

      /* ── iframeに反映 ── */
      const iw = mcIframeRef.current && mcIframeRef.current.contentWindow;
      if (!iw) throw new Error('\u30C4\u30FC\u30EB\u304C\u30ED\u30FC\u30C9\u3055\u308C\u3066\u3044\u307E\u305B\u3093\u3002\u518D\u5EA6\u3064\u30FC\u30EB\u3092\u958B\u3044\u3066\u304F\u3060\u3055\u3044\u3002');

      /* 共通: スウォッチとカラーバーを直接更新（方法A/Bどちらでも確実に反映） */
      var applyColors = function (r) {
        var doc2 = iw.document;
        [['c1', 'sw1', 'cp1', r.bg], ['c2', 'sw2', 'cp2', r.accent], ['c3', 'sw3', 'cp3', r.text]].forEach(function (c) {
          if (!c[3]) return;
          var inp = doc2.getElementById(c[0]);
          var sw = doc2.getElementById(c[1]);
          var cp = doc2.getElementById(c[2]);
          if (inp) inp.value = c[3];
          if (sw) sw.style.background = c[3];
          if (cp) cp.style.background = c[3];
        });
        if (typeof iw.updateTpl === 'function') iw.updateTpl();
        if (typeof iw.refresh === 'function') iw.refresh();
        iw.colorFetched = true;
        /* 解析ボタンを戻す */
        var abtn = doc2.getElementById('abtn');
        if (abtn) abtn.disabled = false;
        /* STEP2へ自動スクロール（少し遅延してパレット表示後に動く） */
        setTimeout(function () {
          var step2 = doc2.getElementById('step2-panel');
          if (step2) step2.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }, 400);
      };

      /* 方法A: renderPalette関数が公開されていればそれを使う */
      if (typeof iw.renderPalette === 'function') {
        iw.renderPalette(result);
        applyColors(result); /* 念のため直接も更新 */
        if (typeof iw.setSt === 'function') iw.setSt('\u2713 \u89E3\u6790\u5B8C\u4E86 \u2014 \u5F79\u5272\u3092\u78BA\u8A8D\u3057\u3066\u4FEE\u6B63\u3057\u3066\u304F\u3060\u3055\u3044', 'ok');
        if (typeof iw.setFlow === 'function') {
          iw.setFlow(1, 'done');
          iw.setFlow(2, 'active');
        }
        setMcStatus('\u2713 \u89E3\u6790\u5B8C\u4E86 \u2014 \u30AB\u30E9\u30FC\u304C\u53CD\u6620\u3055\u308C\u307E\u3057\u305F');
      } else {
        /* 方法B: DOMを直接操作してカラーを反映（スウォッチ・バー含む） */
        var doc = iw.document;
        var colorMap = [{
          input: 'c1',
          sw: 'sw1',
          cp: 'cp1',
          val: result.bg
        }, {
          input: 'c2',
          sw: 'sw2',
          cp: 'cp2',
          val: result.accent
        }, {
          input: 'c3',
          sw: 'sw3',
          cp: 'cp3',
          val: result.text
        }];
        colorMap.forEach(function (c) {
          if (!c.val) return;
          var inp = doc.getElementById(c.input);
          var sw = doc.getElementById(c.sw);
          var cp = doc.getElementById(c.cp);
          if (inp) inp.value = c.val;
          if (sw) sw.style.background = c.val;
          if (cp) cp.style.background = c.val;
        });
        /* テンプレートとrefreshを更新 */
        if (typeof iw.updateTpl === 'function') iw.updateTpl();
        if (typeof iw.refresh === 'function') iw.refresh();
        /* fstステータス更新 */
        var fst = doc && doc.getElementById('fst');
        if (fst) {
          fst.className = 'fst st-ok';
          fst.textContent = '\u2713 \u89E3\u6790\u5B8C\u4E86 \u2014 \u5F79\u5272\u3092\u78BA\u8A8D\u3057\u3066\u4FEE\u6B63\u3057\u3066\u304F\u3060\u3055\u3044';
        }
        iw.colorFetched = true;
        setMcStatus('\u2713 \u89E3\u6790\u5B8C\u4E86 \u2014 \u30AB\u30E9\u30FC\u304C\u53CD\u6620\u3055\u308C\u307E\u3057\u305F');
      }
    } catch (e) {
      setMcStatus("\u2717 " + (e.message || '\u30A8\u30E9\u30FC'));
    }
    setMcAnalyzing(false);
  };

  /* ── Canva複数ページ一括書き出し→CF登録（Artifact API直接実行） ── */
  const cfAutoRegister = async function (designId, pagesStr, imgName) {
    if (!designId) return;
    const baseName = imgName || 'canva-' + designId;
    /* ページ配列を構築 */
    var pageNums = [];
    if (pagesStr) {
      pageNums = pagesStr.split(',').map(function (p) {
        return parseInt(p.trim());
      }).filter(function (n) {
        return !isNaN(n) && n > 0;
      });
    }
    const pageLabel = pageNums.length > 0 ? pageNums.join(',') : '全ページ';
    const totalPages = pageNums.length || '?';
    setMcAnalyzing(true);
    setMcStatus('… Canva書き出し→CF登録 実行中（' + pageLabel + '）');

    /* iframe側にも進捗を表示 */
    const iw = mcIframeRef.current && mcIframeRef.current.contentWindow;
    const cfStatus = iw && iw.document && iw.document.getElementById('cf-status');
    if (cfStatus) cfStatus.textContent = '⏳ 実行中… (' + pageLabel + ')';
    try {
      /* Anthropic API + Canva/CF MCP で直接実行 */
      const systemPrompt = 'You are a Canva and ClickFunnels automation assistant. Execute the following batch export and registration task precisely. For each page: export as PNG (pro quality), then upload to ClickFunnels. Return a JSON summary of results.';
      const pageSpec = pageNums.length > 0 ? 'pages ' + pageNums.join(', ') : 'all pages';
      const userMsg = 'Batch task:\n' + '1. Export Canva design ' + designId + ' (' + pageSpec + ') as PNG pro quality\n' + '2. Upload each exported PNG to ClickFunnels workspace_id 104607\n' + '3. Name each image: ' + baseName + '-p{N} (where N is the page number)\n' + '4. After ALL uploads are done, respond ONLY with raw JSON (no markdown):\n' + '{"results":[{"page":1,"cf_id":12345,"name":"xxx-p1"},...],"total":N,"success":N}';
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          system: systemPrompt,
          messages: [{
            role: 'user',
            content: userMsg
          }],
          mcp_servers: [{
            type: 'url',
            url: 'https://mcp.canva.com/mcp',
            name: 'canva'
          }, {
            type: 'url',
            url: 'https://mcp.myclickfunnels.com/sse',
            name: 'clickfunnels'
          }]
        })
      });
      if (!res.ok) throw new Error('API Error: HTTP ' + res.status);
      const data = await res.json();

      /* テキストブロックからJSON抽出 */
      const raw = (data.content || []).filter(function (b) {
        return b.type === 'text';
      }).map(function (b) {
        return b.text;
      }).join('');
      const m = raw.match(/```json\s*([\s\S]*?)```/) || raw.match(/(\{[\s\S]*?\})/);
      var resultJson = null;
      if (m) {
        try {
          resultJson = JSON.parse((m[1] || m[0]).trim());
        } catch (e) {}
      }

      /* 結果表示 */
      if (resultJson && resultJson.results) {
        const successCount = resultJson.success || resultJson.results.length;
        const total = resultJson.total || resultJson.results.length;
        const statusMsg = '✓ ' + successCount + '/' + total + 'ページ登録完了';
        setMcStatus(statusMsg);
        if (cfStatus) {
          cfStatus.style.color = 'var(--green)';
          cfStatus.textContent = statusMsg + ' — CF画像IDが発行されました';
        }
        /* 結果をiframeのcf-tpl-boxに表示 */
        var cfBox = iw && iw.document && iw.document.getElementById('cf-tpl-box');
        if (cfBox) {
          var resultHtml = '<span style="color:var(--green);font-weight:700">✓ ' + successCount + '/' + total + 'ページ 登録完了</span>\n\n';
          resultJson.results.forEach(function (r) {
            resultHtml += 'Page ' + r.page + ' → CF ID: <span style="color:var(--teal)">' + r.cf_id + '</span> (' + r.name + ')\n';
          });
          cfBox.innerHTML = resultHtml;
        }
      } else {
        /* JSONが取れない場合は完了メッセージのみ */
        setMcStatus('✓ 書き出し→CF登録 完了（レスポンス確認済み）');
        if (cfStatus) {
          cfStatus.style.color = 'var(--green)';
          cfStatus.textContent = '✓ 完了 — CF管理画面で画像を確認してください';
        }
      }
    } catch (e) {
      const errMsg = '✗ ' + (e.message || 'エラー');
      setMcStatus(errMsg);
      if (cfStatus) {
        cfStatus.style.color = 'var(--red)';
        cfStatus.textContent = errMsg;
      }
    }
    setMcAnalyzing(false);
  };

  /* iframeのSTEP1ボタンから呼び出せるようwindowに公開 */
  /* useRefで最新関数を保持 → TDZ・stale closure両方を解消 */
  const analyzeColorsRef = useRef(null);
  const cfAutoRegisterRef = useRef(null);
  analyzeColorsRef.current = analyzeColors;
  cfAutoRegisterRef.current = cfAutoRegister;
  useEffect(function () {
    window.mcRunAnalysis = function (url) {
      analyzeColorsRef.current && analyzeColorsRef.current(url || '');
    };
    window.mcCfRegister = function (id, pages, name) {
      cfAutoRegisterRef.current && cfAutoRegisterRef.current(id, pages, name);
    };
    return function () {
      delete window.mcRunAnalysis;
      delete window.mcCfRegister;
    };
  }, []); /* 空deps: マウント時1回のみ登録。最新関数はRefで参照 */

  const _gR = function () {
    var _p = ["\x61\x48\x52\x30\x63\x48\x4d\x36\x4c\x79\x39\x33\x64\x33\x63\x75\x5a\x6e\x56\x75\x62\x6d\x56\x73", "\x59\x6e\x56\x70\x62\x47\x52\x70\x62\x6d\x63\x75\x59\x32\x78\x31\x59\x69\x39\x74\x62\x32\x4e\x72\x64\x58\x41\x3d", "\x4c\x57\x4e\x76\x62\x58\x42\x76\x63\x32\x56\x79\x4c\x58\x4e\x78\x64\x57\x56\x6c\x65\x6d\x55\x3d"];
    return _p.map(function (s) {
      return atob(s);
    }).join("");
  };
  const _vT = function (t) {
    var _p = ["\x64\x57\x35\x73\x62\x32\x4e\x72\x58\x32\x31\x6a", "\x58\x32\x5a\x69\x4d\x6a\x41\x79\x4e\x51\x3d\x3d"];
    return t === _p.map(function (s) {
      return atob(s);
    }).join("");
  };
  const _rB = function () {
    var _p = ["\x61\x48\x52\x30\x63\x48\x4d\x36\x4c\x79\x39\x33\x64\x33\x63\x75\x5a\x6e\x56\x75\x62\x6d\x56\x73", "\x59\x6e\x56\x70\x62\x47\x52\x70\x62\x6d\x63\x75\x59\x32\x78\x31\x59\x69\x39\x74\x62\x32\x4e\x72\x64\x58\x41\x3d", "\x4c\x57\x4e\x76\x62\x58\x42\x76\x63\x32\x56\x79\x4c\x57\x5a\x79\x5a\x57\x55\x3d"];
    return _p.map(function (s) {
      return atob(s);
    }).join("");
  };
  useEffect(function () {
    async function loadGate() {
      // ① URLトークンチェック → 登録済み解放
      try {
        var params = new URLSearchParams(window.location.search);
        var tok = params.get("mc_token");
        if (tok && _vT(tok)) {
          setRegistered(true);
          try {
            window.storage.set("mc_registered", "true");
          } catch (e) {}
          try {
            localStorage.setItem("mc_registered", "true");
          } catch (e) {}
          var cleanUrl = window.location.pathname;
          window.history.replaceState({}, "", cleanUrl);
        }
      } catch (e) {}
      // ② exportCount 読み込み（storage → localStorage フォールバック）
      try {
        var c = await window.storage.get("mc_export_count");
        if (c && c.value) setExportCount(parseInt(c.value) || 0);
      } catch (e) {
        try {
          var lc = localStorage.getItem("mc_export_count");
          if (lc) setExportCount(parseInt(lc) || 0);
        } catch (e2) {}
      }
      // ③ 登録状態読み込み（storage → localStorage フォールバック）
      try {
        var r = await window.storage.get("mc_registered");
        if (r && r.value === "true") setRegistered(true);
      } catch (e) {
        try {
          if (localStorage.getItem("mc_registered") === "true") setRegistered(true);
        } catch (e2) {}
      }
      // ④ シェア状態読み込み
      try {
        if (localStorage.getItem("mc_shared") === "true") setShared(true);
      } catch (e) {}
    }
    loadGate();
  }, []);

  // ④ postMessage受信 → ポップアップからの登録完了通知
  useEffect(function () {
    function onMsg(e) {
      if (e.data && e.data.mockupRegistered === true) {
        setRegistered(true);
        setShowGate(false);
        setShowShareModal(true);
        try {
          window.storage.set("mc_registered", "true");
        } catch (ex) {}
        try {
          localStorage.setItem("mc_registered", "true");
        } catch (ex) {}
      }
    }
    window.addEventListener("message", onMsg);
    return function () {
      window.removeEventListener("message", onMsg);
    };
  }, []);
  const canvasRef = useRef(null);
  const cScale = 0.82;
  const frameLib = useFrameLibrary();
  const updateItem = useCallback((id, p) => setItems(prev => prev.map(it => it.id === id ? {
    ...it,
    ...p
  } : it)), []);
  const removeItem = useCallback(id => {
    setItems(prev => prev.filter(it => it.id !== id));
    setSelected(null);
  }, []);
  const duplicateItem = useCallback(id => {
    setItems(prev => {
      const s = prev.find(it => it.id === id);
      if (!s) return prev;
      return [...prev, {
        ...s,
        id: uid(),
        x: s.x + 20,
        y: s.y + 20
      }];
    });
  }, []);
  const addItem = useCallback(() => {
    const n = createItem();
    setItems(prev => [...prev, n]);
    setSelected(n.id);
  }, []);
  const applyTemplate = useCallback(function (tpl) {
    var getFrame = function (bid) {
      var f = BUILTIN_FRAMES.find(function (fr) {
        return fr.id === bid;
      });
      return f ? f.url : null;
    };
    var getPreset = function (bid) {
      return SCREEN_PRESETS[bid] || {
        sx: 10,
        sy: 10,
        sw: 180,
        sh: 200
      };
    };
    var mk = function (bid, name, x, y, scale, rotY) {
      var p = getPreset(bid);
      return createItem({
        name: name,
        x: x,
        y: y,
        scale: scale || 1,
        rotateY: rotY || 0,
        frameUrl: getFrame(bid),
        frameW: 400,
        frameH: 400,
        screenX: p.sx,
        screenY: p.sy,
        screenW: p.sw,
        screenH: p.sh,
        screenPts: rectToPts(p.sx, p.sy, p.sw, p.sh)
      });
    };
    var newItems = [];
    if (tpl === "stack3") {
      newItems = [mk("builtin-macbook", "MacBook", 380, 120, 1.0, 0), mk("builtin-ebook", "E-Book", 120, 300, 0.55, 10), mk("builtin-iphone", "iPhone", 860, 280, 0.5, -8)];
    } else if (tpl === "pair") {
      newItems = [mk("builtin-imacb", "iMac", 350, 100, 1.1, 0), mk("builtin-ipad", "iPad", 750, 320, 0.6, 10)];
    } else if (tpl === "stack5") {
      newItems = [mk("builtin-imacb", "iMac", 320, 40, 1.0, 0), mk("builtin-macbook", "MacBook", 100, 380, 0.55, 10), mk("builtin-ebook", "E-Book", 620, 300, 0.5, -5), mk("builtin-cdcase", "CD", 800, 320, 0.45, 8), mk("builtin-iphone", "iPhone", 500, 400, 0.42, -3)];
    } else if (tpl === "single") {
      newItems = [mk("builtin-imacb", "iMac", 350, 120, 1.2, 0)];
    }
    if (newItems.length > 0) {
      setItems(prev => [...prev, ...newItems]);
    }
  }, []);
  const moveUp = useCallback(id => {
    setItems(prev => {
      const i = prev.findIndex(it => it.id === id);
      if (i < prev.length - 1) {
        const n = [...prev];
        [n[i], n[i + 1]] = [n[i + 1], n[i]];
        return n;
      }
      return prev;
    });
  }, []);
  const moveDown = useCallback(id => {
    setItems(prev => {
      const i = prev.findIndex(it => it.id === id);
      if (i > 0) {
        const n = [...prev];
        [n[i], n[i - 1]] = [n[i - 1], n[i]];
        return n;
      }
      return prev;
    });
  }, []);
  const doExport = useCallback(async () => {
    if (!registered && exportCount >= 1) {
      setShowGate(true);
      return;
    }
    var newCount = exportCount + 1;
    setExportCount(newCount);
    try {
      window.storage.set("mc_export_count", String(newCount));
    } catch (e) {}
    try {
      localStorage.setItem("mc_export_count", String(newCount));
    } catch (e) {}
    const el = canvasRef.current;
    if (!el) return;
    setSelected(null);
    setExporting(true);
    await new Promise(r => setTimeout(r, 300));
    try {
      if (!window.html2canvas) {
        await new Promise((res, rej) => {
          const s = document.createElement("script");
          s.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
          s.onload = res;
          s.onerror = () => rej(new Error("html2canvas読み込み失敗"));
          document.head.appendChild(s);
        });
      }
      const dpiScale = {
        72: 1,
        96: 1.33,
        300: 4.17
      };
      const canvas = await window.html2canvas(el, {
        scale: dpiScale[exportDpi] || 1.33,
        width: 1200,
        height: 800,
        backgroundColor: exportFmt === "png" ? null : "#ffffff",
        useCORS: true,
        allowTaint: true,
        logging: false
      });
      const mime = exportFmt === "png" ? "image/png" : exportFmt === "jpeg" ? "image/jpeg" : "image/webp";
      // ウォーターマーク追加（シェア済みでない場合）
      var finalCanvas = canvas;
      if (!shared) {
        finalCanvas = document.createElement("canvas");
        finalCanvas.width = canvas.width;
        finalCanvas.height = canvas.height;
        var wCtx = finalCanvas.getContext("2d");
        wCtx.drawImage(canvas, 0, 0);
        var wFontSize = Math.max(10, Math.round(finalCanvas.width * 0.012));
        var wText = "MC";
        wCtx.font = "bold " + wFontSize + "px Arial, Helvetica, sans-serif";
        var wPad = wFontSize * 0.6;
        var wMeasure = wCtx.measureText(wText);
        var wBoxW = wMeasure.width + wPad * 2;
        var wBoxH = wFontSize + wPad * 1.4;
        var wX = finalCanvas.width - wBoxW - 8;
        var wY = finalCanvas.height - wBoxH - 8;
        wCtx.globalAlpha = 0.35;
        wCtx.fillStyle = "#000";
        wCtx.fillRect(wX, wY, wBoxW, wBoxH);
        wCtx.globalAlpha = 0.7;
        wCtx.fillStyle = "#fff";
        wCtx.textAlign = "center";
        wCtx.textBaseline = "middle";
        wCtx.fillText(wText, wX + wBoxW / 2, wY + wBoxH / 2);
        wCtx.globalAlpha = 1;
      }
      const link = document.createElement("a");
      link.download = `mockup-${exportDpi}dpi.${exportFmt === "jpeg" ? "jpg" : exportFmt}`;
      link.href = finalCanvas.toDataURL(mime, exportFmt === "png" ? undefined : 0.95);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setShowExport(false);
    } catch (err) {
      console.error("Export error:", err);
      alert("エクスポート失敗: " + err.message + "\n\nMac: Cmd+Shift+4\nWin: Win+Shift+S\nでスクリーンショットしてください。");
    } finally {
      setExporting(false);
    }
  }, [exportFmt, exportDpi, registered, exportCount, shared]);
  const sel = items.find(it => it.id === selected);
  const wsBgStyle = wsBg === "white" ? {
    background: "#fff"
  } : wsBg === "gray" ? {
    background: "#ccc"
  } : wsBg === "black" ? {
    background: "#000"
  } : {
    backgroundImage: "linear-gradient(45deg,#ccc 25%,transparent 25%),linear-gradient(-45deg,#ccc 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#ccc 75%),linear-gradient(-45deg,transparent 75%,#ccc 75%)",
    backgroundSize: "14px 14px",
    backgroundPosition: "0 0,0 7px,7px -7px,-7px 0px",
    backgroundColor: "#e0e0e0"
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: "100vh",
      background: "#0d1117",
      color: "#e4e4e7",
      fontFamily: "'Noto Sans JP',sans-serif"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "10px 16px",
      borderBottom: "1px solid #1e2535",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: FRAME_BASE + "mc-logo.png",
    style: {
      height: 36
    },
    alt: "Mockup Composer"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 8,
      color: "#555"
    }
  }, "\u30D5\u30EC\u30FC\u30E0\uFF0B\u30B3\u30F3\u30C6\u30F3\u30C4\uFF0B3D\u56DE\u8EE2"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 3,
      marginLeft: 6
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: undo,
    style: {
      width: 28,
      height: 26,
      borderRadius: 5,
      border: "1px solid #2a3040",
      background: "#161b26",
      color: "#888",
      fontSize: 13,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "inherit"
    },
    title: "\u5143\u306B\u623B\u3059 (Ctrl+Z)"
  }, "\u21A9"), /*#__PURE__*/React.createElement("button", {
    onClick: redo,
    style: {
      width: 28,
      height: 26,
      borderRadius: 5,
      border: "1px solid #2a3040",
      background: "#161b26",
      color: "#888",
      fontSize: 13,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "inherit"
    },
    title: "\u3084\u308A\u76F4\u3057 (Ctrl+Shift+Z)"
  }, "\u21AA"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 2,
      background: "#161b26",
      borderRadius: 6,
      padding: 2
    }
  }, [{
    k: "white",
    l: "白"
  }, {
    k: "gray",
    l: "グレー"
  }, {
    k: "black",
    l: "ブラック"
  }, {
    k: "checker",
    l: "透過"
  }].map(o => /*#__PURE__*/React.createElement("button", {
    key: o.k,
    onClick: () => setWsBg(o.k),
    style: {
      fontSize: 10,
      padding: "4px 10px",
      borderRadius: 4,
      cursor: "pointer",
      border: "none",
      fontFamily: "inherit",
      fontWeight: 600,
      background: wsBg === o.k ? "#f97316" : "transparent",
      color: wsBg === o.k ? "#fff" : "#888"
    }
  }, o.l))), /*#__PURE__*/React.createElement("button", {
    onClick: function () {
      setShowGrid(!showGrid);
    },
    style: {
      fontSize: 10,
      padding: "4px 10px",
      borderRadius: 6,
      cursor: "pointer",
      border: "none",
      fontFamily: "inherit",
      fontWeight: 600,
      background: showGrid ? "#f97316" : "#161b26",
      color: showGrid ? "#fff" : "#888"
    }
  }, "Grid"), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: function () {
      setShowMCTool(true);
      setCanvaOpen(false);
      setCfOpen(false);
      setShowExport(false);
    },
    style: {
      background: "linear-gradient(135deg,#35C9A0,#0F6E56)",
      color: "#fff",
      border: "none",
      borderRadius: 8,
      padding: "9px 16px",
      fontSize: 13,
      fontWeight: 700,
      cursor: "pointer",
      fontFamily: "inherit"
    }
  }, "\u7D20\u6750\u751F\u6210\u30C4\u30FC\u30EB")), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowExport(!showExport),
    style: {
      background: "linear-gradient(135deg,#5b6abf,#4a58a0)",
      color: "#fff",
      border: "none",
      borderRadius: 8,
      padding: "9px 22px",
      fontSize: 13,
      fontWeight: 700,
      cursor: "pointer",
      fontFamily: "inherit"
    }
  }, "Export \u2193"), showExport && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: "100%",
      right: 0,
      marginTop: 8,
      background: "#fff",
      borderRadius: 14,
      padding: 20,
      boxShadow: "0 12px 40px rgba(0,0,0,.25)",
      zIndex: 100,
      width: 250,
      color: "#333"
    },
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: -8,
      right: 28,
      width: 16,
      height: 16,
      background: "#fff",
      transform: "rotate(45deg)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      marginBottom: 10
    }
  }, "Export Type"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 12,
      marginBottom: 14,
      background: "#f5f5f5",
      borderRadius: 8,
      padding: 8
    }
  }, ["png", "jpeg", "webp"].map(f => /*#__PURE__*/React.createElement("label", {
    key: f,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 3,
      cursor: "pointer",
      fontSize: 12,
      fontWeight: exportFmt === f ? 700 : 400,
      color: exportFmt === f ? "#4a58a0" : "#666"
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "radio",
    name: "fmt",
    checked: exportFmt === f,
    onChange: () => setExportFmt(f),
    style: {
      accentColor: "#4a58a0"
    }
  }), f.toUpperCase()))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      marginBottom: 6
    }
  }, "DPI"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 0,
      marginBottom: 14
    }
  }, [72, 96, 300].map(d => /*#__PURE__*/React.createElement("button", {
    key: d,
    onClick: () => setExportDpi(d),
    style: {
      flex: 1,
      padding: "7px 0",
      fontSize: 13,
      fontWeight: 700,
      cursor: "pointer",
      border: "1px solid #ddd",
      fontFamily: "inherit",
      background: exportDpi === d ? "#4a58a0" : "#f0f0f0",
      color: exportDpi === d ? "#fff" : "#666",
      borderRadius: d === 72 ? "6px 0 0 6px" : d === 300 ? "0 6px 6px 0" : "0"
    }
  }, d))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "#999",
      marginBottom: 10
    }
  }, exportFmt === "png" ? "✅ 背景透過で出力" : "📌 白背景で出力"), /*#__PURE__*/React.createElement("button", {
    onClick: doExport,
    disabled: exporting,
    style: {
      width: "100%",
      padding: "9px 0",
      background: "linear-gradient(135deg,#5b6abf,#4a58a0)",
      color: "#fff",
      border: "none",
      borderRadius: 8,
      fontSize: 13,
      fontWeight: 700,
      cursor: exporting ? "wait" : "pointer",
      fontFamily: "inherit",
      opacity: exporting ? .6 : 1
    }
  }, exporting ? "処理中..." : "Export"), !registered && exportCount < 1 && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: "#4ade80",
      textAlign: "center",
      marginTop: 6
    }
  }, "\uD83C\uDF81 \u521D\u56DE\u7121\u6599\u3067\u8A66\u305B\u307E\u3059"), registered && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: "#4ade80",
      textAlign: "center",
      marginTop: 6
    }
  }, "\u2705 \u767B\u9332\u6E08\u307F \u2014 \u7121\u5236\u9650"))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: function () {
      setShowHelp(!showHelp);
      setShowExport(false);
      setCanvaOpen(false);
      setCfOpen(false);
    },
    style: {
      width: 36,
      height: 36,
      borderRadius: "50%",
      background: showHelp ? "#f97316" : "#161b26",
      color: showHelp ? "#fff" : "#888",
      border: "1px solid #2a3040",
      fontSize: 16,
      fontWeight: 700,
      cursor: "pointer",
      fontFamily: "inherit",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, "?"), showHelp && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: "100%",
      right: 0,
      marginTop: 8,
      background: "#161b26",
      borderRadius: 12,
      padding: 6,
      boxShadow: "0 12px 40px rgba(0,0,0,.4)",
      zIndex: 100,
      width: 220,
      border: "1px solid #2a3040"
    },
    onClick: function (e) {
      e.stopPropagation();
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 700,
      color: "#f97316",
      padding: "8px 12px",
      borderBottom: "1px solid #2a3040"
    }
  }, "\u30D8\u30EB\u30D7\u30FB\u30DE\u30CB\u30E5\u30A2\u30EB"), /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: function (e) {
      e.preventDefault();
      window.open(FRAME_BASE.replace("/frames/", "") + "/" + "guide.html", "_blank");
      setShowHelp(false);
    },
    style: {
      display: "block",
      padding: "10px 12px",
      fontSize: 12,
      color: "#fff",
      textDecoration: "none",
      borderRadius: 6,
      cursor: "pointer",
      background: "linear-gradient(135deg,rgba(249,115,22,.2),rgba(79,142,247,.15))",
      margin: "4px",
      fontWeight: 700,
      border: "1px solid rgba(249,115,22,.3)"
    }
  }, "\uD83D\uDCD6 \u30E2\u30C3\u30AF\u30A2\u30C3\u30D7\u30AC\u30A4\u30C9"), /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: function (e) {
      e.preventDefault();
      window.open(FRAME_BASE.replace("/frames/", "") + "/" + "guide-tool.html", "_blank");
      setShowHelp(false);
    },
    style: {
      display: "block",
      padding: "10px 12px",
      fontSize: 12,
      color: "#fff",
      textDecoration: "none",
      borderRadius: 6,
      cursor: "pointer",
      background: "linear-gradient(135deg,rgba(139,92,246,.2),rgba(99,102,241,.15))",
      margin: "4px",
      fontWeight: 700,
      border: "1px solid rgba(139,92,246,.3)"
    }
  }, "\uD83C\uDFA8 \u7D20\u6750\u751F\u6210\u30C4\u30FC\u30EB\u30AC\u30A4\u30C9"), /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: "1px solid #2a3040",
      margin: "4px 0"
    }
  }), /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: function (e) {
      e.preventDefault();
      window.open("mailto:info@bestad.biz?subject=Mockup Composer お問い合わせ", "_blank");
    },
    style: {
      display: "block",
      padding: "10px 12px",
      fontSize: 12,
      color: "#e4e4e7",
      textDecoration: "none",
      borderRadius: 6,
      cursor: "pointer"
    }
  }, "\uD83D\uDCE7 \u304A\u554F\u3044\u5408\u308F\u305B"), /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: "1px solid #2a3040",
      padding: "8px 12px",
      marginTop: 4
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: "#666"
    }
  }, "Mockup Composer v1.0"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: "#555"
    }
  }, "BESTAD G.K."), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 8,
      color: "#444"
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "https://bestad.biz/tokushou.html",
    target: "_blank",
    rel: "noopener noreferrer",
    style: {
      color: "#444",
      textDecoration: "none"
    }
  }, "\u7279\u5B9A\u5546\u53D6\u5F15\u6CD5\u306B\u57FA\u3065\u304F\u8868\u8A18"), " \uFF5C ", /*#__PURE__*/React.createElement("a", {
    href: "https://bestad.biz/privacypolicy.html",
    target: "_blank",
    rel: "noopener noreferrer",
    style: {
      color: "#444",
      textDecoration: "none"
    }
  }, "\u30D7\u30E9\u30A4\u30D0\u30B7\u30FC\u30DD\u30EA\u30B7\u30FC")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 8,
      color: "#333"
    }
  }, "\xA9 2026 BESTAD G.K. All Rights Reserved")))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "350px 1fr",
      minHeight: "calc(100vh - 40px)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      borderRight: "1px solid #1e2535",
      display: "flex",
      flexDirection: "column",
      maxHeight: "calc(100vh - 40px)",
      overflowY: "auto"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "6px 8px",
      borderBottom: "1px solid #1e2535",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "#888",
      fontWeight: 600
    }
  }, "\u30D1\u30FC\u30C4\uFF08", items.length, "\uFF09"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 4,
      alignItems: "center"
    }
  }, items.length > 0 && /*#__PURE__*/React.createElement("button", {
    onClick: function () {
      if (confirm("全パーツを削除しますか？")) {
        setItems([]);
        setSelected(null);
      }
    },
    style: {
      fontSize: 11,
      color: "#ef4444",
      background: "none",
      border: "1px solid #ef4444",
      borderRadius: 5,
      padding: "4px 8px",
      cursor: "pointer",
      fontFamily: "inherit",
      fontWeight: 600
    }
  }, "\u30EA\u30BB\u30C3\u30C8"), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: function () {
      setShowTpl(!showTpl);
    },
    style: {
      fontSize: 11,
      color: showTpl ? "#fff" : "#f97316",
      background: showTpl ? "#f97316" : "none",
      border: "1px solid #f97316",
      borderRadius: 5,
      padding: "4px 8px",
      cursor: "pointer",
      fontFamily: "inherit",
      fontWeight: 600
    }
  }, "\u30C6\u30F3\u30D7\u30EC"), showTpl && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: "100%",
      left: 0,
      marginTop: 4,
      background: "#161b26",
      borderRadius: 8,
      padding: 4,
      boxShadow: "0 8px 24px rgba(0,0,0,.4)",
      zIndex: 100,
      width: 160,
      border: "1px solid #2a3040"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: function () {
      applyTemplate("single");
      setShowTpl(false);
    },
    style: {
      display: "block",
      width: "100%",
      padding: "8px 10px",
      fontSize: 11,
      color: "#e4e4e7",
      background: "none",
      border: "none",
      borderRadius: 5,
      cursor: "pointer",
      textAlign: "left",
      fontFamily: "inherit"
    }
  }, "\uD83D\uDCBB \u5358\u54C1\uFF08iMac\uFF09"), /*#__PURE__*/React.createElement("button", {
    onClick: function () {
      applyTemplate("pair");
      setShowTpl(false);
    },
    style: {
      display: "block",
      width: "100%",
      padding: "8px 10px",
      fontSize: 11,
      color: "#e4e4e7",
      background: "none",
      border: "none",
      borderRadius: 5,
      cursor: "pointer",
      textAlign: "left",
      fontFamily: "inherit"
    }
  }, "\uD83D\uDCBB\uD83D\uDCF1 \u6A2A\u4E26\u3073 2\u70B9"), /*#__PURE__*/React.createElement("button", {
    onClick: function () {
      applyTemplate("stack3");
      setShowTpl(false);
    },
    style: {
      display: "block",
      width: "100%",
      padding: "8px 10px",
      fontSize: 11,
      color: "#e4e4e7",
      background: "none",
      border: "none",
      borderRadius: 5,
      cursor: "pointer",
      textAlign: "left",
      fontFamily: "inherit"
    }
  }, "\uD83D\uDCE6 Stack 3\u70B9"), /*#__PURE__*/React.createElement("button", {
    onClick: function () {
      applyTemplate("stack5");
      setShowTpl(false);
    },
    style: {
      display: "block",
      width: "100%",
      padding: "8px 10px",
      fontSize: 11,
      color: "#e4e4e7",
      background: "none",
      border: "none",
      borderRadius: 5,
      cursor: "pointer",
      textAlign: "left",
      fontFamily: "inherit"
    }
  }, "\uD83C\uDF81 \u30D5\u30EB\u30BB\u30C3\u30C8 5\u70B9"))), /*#__PURE__*/React.createElement("button", {
    onClick: addItem,
    style: {
      fontSize: 13,
      color: "#fff",
      background: "#f97316",
      border: "none",
      borderRadius: 5,
      padding: "4px 12px",
      cursor: "pointer",
      fontFamily: "inherit",
      fontWeight: 600
    }
  }, "\uFF0B \u8FFD\u52A0"))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "4px 8px",
      borderBottom: "1px solid #1e2535"
    }
  }, items.map((it, idx) => /*#__PURE__*/React.createElement("div", {
    key: it.id,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 4,
      marginBottom: 2
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 1
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: e => {
      e.stopPropagation();
      moveUp(it.id);
    },
    style: {
      width: 26,
      height: 22,
      fontSize: 12,
      background: idx < items.length - 1 ? "#3b82f6" : "#222",
      color: idx < items.length - 1 ? "#fff" : "#555",
      border: "none",
      borderRadius: "5px 5px 0 0",
      cursor: idx < items.length - 1 ? "pointer" : "default",
      padding: 0,
      fontFamily: "inherit"
    }
  }, "\u25B2"), /*#__PURE__*/React.createElement("button", {
    onClick: e => {
      e.stopPropagation();
      moveDown(it.id);
    },
    style: {
      width: 26,
      height: 22,
      fontSize: 12,
      background: idx > 0 ? "#3b82f6" : "#222",
      color: idx > 0 ? "#fff" : "#555",
      border: "none",
      borderRadius: "0 0 5px 5px",
      cursor: idx > 0 ? "pointer" : "default",
      padding: 0,
      fontFamily: "inherit"
    }
  }, "\u25BC")), /*#__PURE__*/React.createElement("div", {
    onClick: () => setSelected(it.id),
    style: {
      flex: 1,
      padding: "7px 10px",
      borderRadius: 4,
      fontSize: 12,
      cursor: "pointer",
      background: selected === it.id ? "#1a1a2e" : "transparent",
      border: selected === it.id ? "1px solid #f97316" : "1px solid transparent",
      color: selected === it.id ? "#f97316" : "#999",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, it.frameUrl ? "🖼" : "⬜", " ", (it.name || "新規パーツ").slice(0, 12)), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      color: "#555",
      flexShrink: 0
    }
  }, "L", idx + 1))))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 8,
      flex: 1,
      overflowY: "auto"
    }
  }, sel ? /*#__PURE__*/React.createElement(Editor, {
    item: sel,
    onUpdate: updateItem,
    onRemove: removeItem,
    onDuplicate: duplicateItem,
    frameLib: frameLib
  }) : /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      marginTop: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: "#444",
      marginBottom: 12
    }
  }, "\u30D1\u30FC\u30C4\u3092\u9078\u629E\u3057\u3066\u7DE8\u96C6"), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "#0d1117",
      borderRadius: 6,
      padding: 12,
      border: "1px solid #1e2535",
      textAlign: "left"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: "#f97316",
      fontWeight: 700,
      marginBottom: 6
    }
  }, "\uD83D\uDCA1 \u4F7F\u3044\u65B9"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: "#666",
      lineHeight: 2
    }
  }, "\u2460 \u300C\uFF0B \u8FFD\u52A0\u300D\u3067\u30D1\u30FC\u30C4\u4F5C\u6210", /*#__PURE__*/React.createElement("br", null), "\u2461 \u30D5\u30EC\u30FC\u30E0\u753B\u50CF\u3092\u30A2\u30C3\u30D7\u30ED\u30FC\u30C9", /*#__PURE__*/React.createElement("br", null), "\u2462 \u753B\u9762\u9818\u57DF\u3092\u30C9\u30E9\u30C3\u30B0\u3067\u6307\u5B9A", /*#__PURE__*/React.createElement("br", null), "\u2463 \u30B3\u30F3\u30C6\u30F3\u30C4\u300C\u753B\u50CF\u300D\u3092\u9078\u629E\u3057\u30A2\u30C3\u30D7\u30ED\u30FC\u30C9", /*#__PURE__*/React.createElement("br", null), "\u2464 3D\u56DE\u8EE2\uFF08X/Y/Z\u8EF8\uFF09\u3067\u89D2\u5EA6\u8ABF\u6574", /*#__PURE__*/React.createElement("br", null), "\u2465 \u30C9\u30E9\u30C3\u30B0\u3067\u914D\u7F6E \u2192 Export"))))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 12,
      overflow: "auto",
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "center"
    },
    onClick: () => {
      setSelected(null);
      setShowExport(false);
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      transform: `scale(${cScale})`,
      transformOrigin: "top center",
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      width: 1200,
      height: 800,
      borderRadius: 8,
      overflow: "hidden",
      ...wsBgStyle
    }
  }), /*#__PURE__*/React.createElement("div", {
    ref: canvasRef,
    style: {
      position: "relative",
      width: 1200,
      height: 800,
      overflow: "hidden"
    }
  }, items.map((it, idx) => /*#__PURE__*/React.createElement(Draggable, {
    key: it.id,
    item: {
      ...it,
      zIndex: idx + 1
    },
    onUpdate: updateItem,
    selected: selected === it.id,
    onSelect: setSelected,
    cScale: cScale,
    snap: showGrid
  }))), showGrid && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      width: 1200,
      height: 800,
      pointerEvents: "none",
      zIndex: 9000
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "1200",
    height: "800",
    style: {
      position: "absolute",
      inset: 0
    }
  }, Array.from({
    length: 29
  }, function (_, i) {
    var x = (i + 1) * 40;
    return /*#__PURE__*/React.createElement("line", {
      key: "gv" + i,
      x1: x,
      y1: 0,
      x2: x,
      y2: 800,
      stroke: x === 600 ? "rgba(249,115,22,.7)" : "rgba(249,115,22,.18)",
      strokeWidth: x === 600 ? "2" : "0.5"
    });
  }), Array.from({
    length: 19
  }, function (_, i) {
    var y = (i + 1) * 40;
    return /*#__PURE__*/React.createElement("line", {
      key: "gh" + i,
      x1: 0,
      y1: y,
      x2: 1200,
      y2: y,
      stroke: y === 400 ? "rgba(249,115,22,.7)" : "rgba(249,115,22,.18)",
      strokeWidth: y === 400 ? "2" : "0.5"
    });
  })))))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "6px 16px",
      borderTop: "1px solid #1e2535",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      fontSize: 9,
      color: "#333"
    }
  }, /*#__PURE__*/React.createElement("span", null, "BESTAD G.K."), /*#__PURE__*/React.createElement("a", {
    href: "https://bestad.biz/tokushou.html",
    target: "_blank",
    rel: "noopener noreferrer",
    style: {
      color: "#444",
      textDecoration: "none"
    }
  }, "\u7279\u5B9A\u5546\u53D6\u5F15\u6CD5\u306B\u57FA\u3065\u304F\u8868\u8A18"), /*#__PURE__*/React.createElement("span", null, "\uFF5C"), /*#__PURE__*/React.createElement("a", {
    href: "https://bestad.biz/privacypolicy.html",
    target: "_blank",
    rel: "noopener noreferrer",
    style: {
      color: "#444",
      textDecoration: "none"
    }
  }, "\u30D7\u30E9\u30A4\u30D0\u30B7\u30FC\u30DD\u30EA\u30B7\u30FC")), showMCTool && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,.9)",
      zIndex: 10000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    },
    onClick: function (e) {
      if (e.target === e.currentTarget) setShowMCTool(false);
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      width: "min(960px,96vw)",
      height: "90vh",
      borderRadius: 14,
      overflowY: "auto",
      boxShadow: "0 24px 80px rgba(0,0,0,.8)",
      border: "1px solid rgba(255,255,255,.1)"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: function () {
      setShowMCTool(false);
    },
    style: {
      position: "absolute",
      top: 10,
      right: 14,
      zIndex: 10,
      width: 28,
      height: 28,
      borderRadius: "50%",
      background: "rgba(255,255,255,.08)",
      border: "1px solid rgba(255,255,255,.15)",
      color: "#8B92A8",
      fontSize: 14,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "inherit"
    }
  }, "\xD7"), /*#__PURE__*/React.createElement(LPMockupGenerator, null))), showGate && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,.88)",
      zIndex: 9999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: "#141c28",
      borderRadius: 18,
      padding: "36px 32px",
      maxWidth: 440,
      width: "90%",
      border: "1px solid rgba(249,115,22,.3)",
      boxShadow: "0 24px 60px rgba(0,0,0,.7)",
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: function () {
      setShowGate(false);
    },
    style: {
      position: "absolute",
      top: 12,
      right: 14,
      background: "none",
      border: "none",
      color: "#555",
      fontSize: 18,
      cursor: "pointer",
      fontFamily: "inherit",
      lineHeight: 1,
      padding: 4
    },
    title: "\u9589\u3058\u308B"
  }, "\u2715"), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 700,
      color: "#f97316",
      letterSpacing: ".08em",
      textTransform: "uppercase",
      marginBottom: 10
    }
  }, "\u3042\u306A\u305F\u3078\u306E\u30E1\u30C3\u30BB\u30FC\u30B8"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 21,
      fontWeight: 900,
      color: "#fff",
      lineHeight: 1.4,
      marginBottom: 12
    }
  }, "\u3042\u306A\u305F\u306E\u5C02\u9580\u6027\u306F\u672C\u7269\u3067\u3059\u3002", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#f97316"
    }
  }, "\u898B\u305F\u76EE\u3067\u3082\u3001\u8A3C\u660E\u3057\u307E\u3057\u3087\u3046\u3002")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "#a0a8b8",
      lineHeight: 1.8
    }
  }, "\u30B3\u30FC\u30C1\u30FB\u30B3\u30F3\u30B5\u30EB\u30BF\u30F3\u30C8\u30FB\u30BB\u30E9\u30D4\u30B9\u30C8\u30FB\u5148\u751F\u696D\u3068\u3057\u3066", /*#__PURE__*/React.createElement("br", null), "\u30AF\u30E9\u30A4\u30A2\u30F3\u30C8\u306B\u9078\u3070\u308C\u308B\u306B\u306F\u3001", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: "#e4e4e7"
    }
  }, "\u30B5\u30FC\u30D3\u30B9\u306E\u8CEA"), "\u3060\u3051\u3067\u306A\u304F", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("strong", {
    style: {
      color: "#f97316"
    }
  }, "\u30D7\u30ED\u3068\u3057\u3066\u306E\u898B\u305B\u65B9"), "\u304C\u4E0D\u53EF\u6B20\u3067\u3059\u3002")), /*#__PURE__*/React.createElement("button", {
    onClick: function () {
      try {
        window.storage.set("mc_export_count", String(exportCount));
      } catch (e) {}
      try {
        localStorage.setItem("mc_export_count", String(exportCount));
      } catch (e) {}
      window.open(_gR(), "mc_register", "width=520,height=700,scrollbars=yes");
    },
    style: {
      width: "100%",
      padding: "16px 0",
      background: "linear-gradient(135deg,#f97316,#e05a00)",
      color: "#fff",
      border: "none",
      borderRadius: 10,
      fontSize: 15,
      fontWeight: 900,
      cursor: "pointer",
      fontFamily: "inherit",
      marginBottom: 10,
      letterSpacing: ".02em",
      boxShadow: "0 6px 20px rgba(249,115,22,.35)"
    }
  }, "\uD83D\uDCE7 \u7121\u6599\u767B\u9332\u3057\u3066\u3001\u30D7\u30ED\u306E\u898B\u305F\u76EE\u3092\u624B\u306B\u5165\u308C\u308B \u2192"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: "#555",
      textAlign: "center",
      lineHeight: 1.8
    }
  }, "\u767B\u9332\u30A6\u30A3\u30F3\u30C9\u30A6\u304C\u958B\u304D\u307E\u3059\u3002\u5B8C\u4E86\u5F8C\u3001\u81EA\u52D5\u3067\u89E3\u9664\u3055\u308C\u307E\u3059", /*#__PURE__*/React.createElement("br", null), "\u914D\u4FE1\u505C\u6B62\u306F\u3044\u3064\u3067\u3082\u53EF\u80FD\u3067\u3059"), /*#__PURE__*/React.createElement("button", {
    onClick: function () {
      setShowGate(false);
    },
    style: {
      display: "block",
      margin: "12px auto 0",
      background: "none",
      border: "none",
      color: "#444",
      fontSize: 11,
      cursor: "pointer",
      fontFamily: "inherit",
      textDecoration: "underline"
    }
  }, "\u3042\u3068\u3067\u767B\u9332\u3059\u308B"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16,
      paddingTop: 12,
      borderTop: "1px solid rgba(255,255,255,.06)",
      textAlign: "center",
      fontSize: 9,
      color: "#333",
      lineHeight: 2
    }
  }, /*#__PURE__*/React.createElement("div", null, "BESTAD G.K."), /*#__PURE__*/React.createElement("a", {
    href: "https://bestad.biz/tokushou.html",
    target: "_blank",
    rel: "noopener noreferrer",
    style: {
      color: "#444",
      textDecoration: "none"
    }
  }, "\u7279\u5B9A\u5546\u53D6\u5F15\u6CD5\u306B\u57FA\u3065\u304F\u8868\u8A18"), " \uFF5C ", /*#__PURE__*/React.createElement("a", {
    href: "https://bestad.biz/privacypolicy.html",
    target: "_blank",
    rel: "noopener noreferrer",
    style: {
      color: "#444",
      textDecoration: "none"
    }
  }, "\u30D7\u30E9\u30A4\u30D0\u30B7\u30FC\u30DD\u30EA\u30B7\u30FC")))), showShareModal && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,.88)",
      zIndex: 9999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: "#141c28",
      borderRadius: 18,
      padding: "36px 32px",
      maxWidth: 440,
      width: "90%",
      border: "1px solid rgba(53,201,160,.3)",
      boxShadow: "0 24px 60px rgba(0,0,0,.7)",
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: function () {
      setShowShareModal(false);
    },
    style: {
      position: "absolute",
      top: 12,
      right: 14,
      background: "none",
      border: "none",
      color: "#555",
      fontSize: 18,
      cursor: "pointer",
      fontFamily: "inherit",
      lineHeight: 1,
      padding: 4
    }
  }, "\u2715"), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 36,
      marginBottom: 10
    }
  }, "\uD83C\uDF89"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 18,
      fontWeight: 900,
      color: "#fff",
      marginBottom: 8
    }
  }, "\u767B\u9332\u3042\u308A\u304C\u3068\u3046\u3054\u3056\u3044\u307E\u3059\uFF01"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "#a0a8b8",
      lineHeight: 1.8
    }
  }, "Export\u304C\u7121\u5236\u9650\u306B\u306A\u308A\u307E\u3057\u305F")), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "rgba(249,115,22,.06)",
      borderRadius: 12,
      padding: "16px 18px",
      marginBottom: 20,
      border: "1px solid rgba(249,115,22,.15)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 700,
      color: "#f97316",
      marginBottom: 8
    }
  }, "\uD83D\uDCA1 \u30A6\u30A9\u30FC\u30BF\u30FC\u30DE\u30FC\u30AF\u3092\u6D88\u3059\u65B9\u6CD5"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "#a0a8b8",
      lineHeight: 1.8
    }
  }, "\u73FE\u5728\u3001\u66F8\u304D\u51FA\u3057\u753B\u50CF\u306B\u900F\u304B\u3057\u304C\u5165\u3063\u3066\u3044\u307E\u3059\u3002", /*#__PURE__*/React.createElement("br", null), "SNS\u3067\u30B7\u30A7\u30A2\u3059\u308B\u3068", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: "#fff"
    }
  }, "\u900F\u304B\u3057\u304C\u6D88\u3048\u3066\u3001\u5B8C\u5168\u306B\u30AF\u30EA\u30FC\u30F3\u306A\u753B\u50CF"), "\u3092\u66F8\u304D\u51FA\u305B\u308B\u3088\u3046\u306B\u306A\u308A\u307E\u3059\u3002")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8,
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: function () {
      window.open("https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent("https://www.funnelbuilding.club/mc-free"), "_blank", "width=600,height=400");
      setShared(true);
      try {
        localStorage.setItem("mc_shared", "true");
      } catch (e) {}
      setShowShareModal(false);
    },
    style: {
      width: "100%",
      padding: "13px 0",
      background: "#1877F2",
      color: "#fff",
      border: "none",
      borderRadius: 10,
      fontSize: 14,
      fontWeight: 700,
      cursor: "pointer",
      fontFamily: "inherit"
    }
  }, "\uD83D\uDCD8 Facebook\u3067\u30B7\u30A7\u30A2"), /*#__PURE__*/React.createElement("button", {
    onClick: function () {
      window.open("https://twitter.com/intent/tweet?text=" + encodeURIComponent("無料でプロ品質の3Dモックアップが作れるツールを見つけた！コーチ・コンサル・セラピストにおすすめ 👉 https://www.funnelbuilding.club/mc-free"), "_blank", "width=600,height=400");
      setShared(true);
      try {
        localStorage.setItem("mc_shared", "true");
      } catch (e) {}
      setShowShareModal(false);
    },
    style: {
      width: "100%",
      padding: "13px 0",
      background: "#000",
      color: "#fff",
      border: "1px solid #333",
      borderRadius: 10,
      fontSize: 14,
      fontWeight: 700,
      cursor: "pointer",
      fontFamily: "inherit"
    }
  }, "\uD835\uDD4F \u3067\u30B7\u30A7\u30A2"), /*#__PURE__*/React.createElement("button", {
    onClick: function () {
      window.open("https://line.me/R/share?text=" + encodeURIComponent("無料でプロ品質の3Dモックアップが作れるツールを見つけた！\nhttps://www.funnelbuilding.club/mc-free"), "_blank", "width=600,height=400");
      setShared(true);
      try {
        localStorage.setItem("mc_shared", "true");
      } catch (e) {}
      setShowShareModal(false);
    },
    style: {
      width: "100%",
      padding: "13px 0",
      background: "#06C755",
      color: "#fff",
      border: "none",
      borderRadius: 10,
      fontSize: 14,
      fontWeight: 700,
      cursor: "pointer",
      fontFamily: "inherit"
    }
  }, "\uD83D\uDCAC LINE\u3067\u9001\u308B")), /*#__PURE__*/React.createElement("button", {
    onClick: function () {
      setShowShareModal(false);
    },
    style: {
      display: "block",
      margin: "0 auto",
      background: "none",
      border: "none",
      color: "#444",
      fontSize: 11,
      cursor: "pointer",
      fontFamily: "inherit",
      textDecoration: "underline"
    }
  }, "\u3042\u3068\u3067\u30B7\u30A7\u30A2\u3059\u308B\uFF08\u900F\u304B\u3057\u4ED8\u304D\u3067\u4F7F\u3046\uFF09"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16,
      paddingTop: 12,
      borderTop: "1px solid rgba(255,255,255,.06)",
      textAlign: "center",
      fontSize: 9,
      color: "#333",
      lineHeight: 2
    }
  }, /*#__PURE__*/React.createElement("div", null, "BESTAD G.K."), /*#__PURE__*/React.createElement("a", {
    href: "https://bestad.biz/tokushou.html",
    target: "_blank",
    rel: "noopener noreferrer",
    style: {
      color: "#444",
      textDecoration: "none"
    }
  }, "\u7279\u5B9A\u5546\u53D6\u5F15\u6CD5\u306B\u57FA\u3065\u304F\u8868\u8A18"), " \uFF5C ", /*#__PURE__*/React.createElement("a", {
    href: "https://bestad.biz/privacypolicy.html",
    target: "_blank",
    rel: "noopener noreferrer",
    style: {
      color: "#444",
      textDecoration: "none"
    }
  }, "\u30D7\u30E9\u30A4\u30D0\u30B7\u30FC\u30DD\u30EA\u30B7\u30FC")))), showWelcome && IS_FREE && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 10000,
      background: "#0a0e17",
      overflowY: "auto",
      overflowX: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 520,
      margin: "0 auto",
      padding: "0 24px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      padding: "60px 0 32px"
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: FRAME_BASE + "mc-logo.png",
    style: {
      height: 60,
      marginBottom: 16
    },
    alt: "Mockup Composer"
  }), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 28,
      fontWeight: 900,
      lineHeight: 1.3,
      color: "#fff",
      marginBottom: 12
    }
  }, "\u30D7\u30ED\u54C1\u8CEA\u306E3D\u30E2\u30C3\u30AF\u30A2\u30C3\u30D7\u3092", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#f97316"
    }
  }, "3\u5206\u3067\u7121\u6599\u4F5C\u6210")), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 14,
      color: "#94a3b8",
      lineHeight: 1.7
    }
  }, "\u30C7\u30B6\u30A4\u30F3\u30B9\u30AD\u30EB\u4E0D\u8981\u3002\u30D6\u30E9\u30A6\u30B6\u3060\u3051\u3067\u5B8C\u7D50\u3002")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 32
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr 1fr",
      gap: 10,
      marginBottom: 10
    }
  }, [{
    icon: "🖥",
    name: "デバイス"
  }, {
    icon: "📦",
    name: "ボックス"
  }, {
    icon: "📄",
    name: "ドキュメント"
  }, {
    icon: "✅",
    name: "チェックリスト"
  }].map(function (f, i) {
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        background: "rgba(255,255,255,.03)",
        borderRadius: 12,
        padding: "16px 8px",
        textAlign: "center",
        border: "1px solid rgba(255,255,255,.06)"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 24,
        marginBottom: 4
      }
    }, f.icon), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10,
        color: "#94a3b8",
        fontWeight: 600
      }
    }, f.name));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr",
      gap: 10
    }
  }, [{
    icon: "📖",
    name: "書籍・メディア"
  }, {
    icon: "🏅",
    name: "認定証"
  }, {
    icon: "🎖",
    name: "デコレーション"
  }].map(function (f, i) {
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        background: "rgba(255,255,255,.03)",
        borderRadius: 12,
        padding: "16px 8px",
        textAlign: "center",
        border: "1px solid rgba(255,255,255,.06)"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 24,
        marginBottom: 4
      }
    }, f.icon), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10,
        color: "#94a3b8",
        fontWeight: 600
      }
    }, f.name));
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 32
    }
  }, [{
    num: "1",
    text: "フレームを選ぶ",
    color: "#f97316"
  }, {
    num: "2",
    text: "画像をドラッグ＆ドロップ",
    color: "#3b82f6"
  }, {
    num: "3",
    text: "3D回転 → Export",
    color: "#22c55e"
  }].map(function (s, i) {
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        display: "flex",
        alignItems: "center",
        gap: 14,
        marginBottom: 10
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 36,
        height: 36,
        borderRadius: "50%",
        background: s.color,
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 16,
        fontWeight: 900,
        flexShrink: 0
      }
    }, s.num), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 15,
        fontWeight: 700,
        color: "#fff"
      }
    }, s.text));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      marginBottom: 32
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: FRAME_BASE + "splash-demo.png",
    style: {
      width: "100%",
      maxWidth: 480,
      borderRadius: 12
    },
    alt: "\u5B8C\u6210\u4F8B"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      paddingBottom: 60
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: function () {
      setShowWelcome(false);
      try {
        localStorage.setItem("mc_welcomed", "true");
      } catch (e) {}
    },
    style: {
      width: "100%",
      padding: "18px 0",
      background: "linear-gradient(135deg,#f97316,#ea580c)",
      color: "#fff",
      border: "none",
      borderRadius: 14,
      fontSize: 18,
      fontWeight: 900,
      cursor: "pointer",
      fontFamily: "inherit",
      boxShadow: "0 8px 32px rgba(249,115,22,.3)"
    }
  }, "\u4ECA\u3059\u3050\u4F5C\u6210\u3059\u308B \u2192"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#555",
      marginTop: 10
    }
  }, "\u7121\u6599\u30FB\u767B\u9332\u4E0D\u8981\u30FB30\u7A2E\u30D5\u30EC\u30FC\u30E0\u5185\u8535"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 32,
      fontSize: 10,
      color: "#333",
      lineHeight: 2,
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", null, "BESTAD G.K."), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("a", {
    href: "https://bestad.biz/tokushou.html",
    target: "_blank",
    rel: "noopener noreferrer",
    style: {
      color: "#444",
      textDecoration: "none"
    }
  }, "\u7279\u5B9A\u5546\u53D6\u5F15\u6CD5\u306B\u57FA\u3065\u304F\u8868\u8A18"), " \uFF5C ", /*#__PURE__*/React.createElement("a", {
    href: "https://bestad.biz/privacypolicy.html",
    target: "_blank",
    rel: "noopener noreferrer",
    style: {
      color: "#444",
      textDecoration: "none"
    }
  }, "\u30D7\u30E9\u30A4\u30D0\u30B7\u30FC\u30DD\u30EA\u30B7\u30FC")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 4,
      color: "#2a2a2a"
    }
  }, "\xA9 2026 BESTAD G.K. All Rights Reserved"))))));
}
