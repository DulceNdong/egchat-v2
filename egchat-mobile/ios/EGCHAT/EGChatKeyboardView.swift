import UIKit
import React

@objc(EGChatKeyboardViewManager)
final class EGChatKeyboardViewManager: RCTViewManager {
  override func view() -> UIView! { EGChatKeyboardView() }
  override static func requiresMainQueueSetup() -> Bool { true }
}

// ── Layouts ──────────────────────────────────────────────────

private enum Lang: String, CaseIterable { case es = "ES", en = "EN", fr = "FR" }

// Filas de letras por idioma (sin teclas especiales — se añaden aparte)
private let letters: [Lang: [[String]]] = [
  .es: [
    ["q","w","e","r","t","y","u","i","o","p"],
    ["a","s","d","f","g","h","j","k","l","ñ"],
    ["z","x","c","v","b","n","m"],
  ],
  .en: [
    ["q","w","e","r","t","y","u","i","o","p"],
    ["a","s","d","f","g","h","j","k","l"],
    ["z","x","c","v","b","n","m"],
  ],
  .fr: [
    ["a","z","e","r","t","y","u","i","o","p"],
    ["q","s","d","f","g","h","j","k","l","m"],
    ["w","x","c","v","b","n"],
  ],
]

private let numRow1 = ["1","2","3","4","5","6","7","8","9","0"]
private let numRow2 = ["-","/",":",";","(",")","\u{20AC}","&","@","\""]
private let numRow3 = [".",",","?","!","'"]

private let accentMap: [String:[String]] = [
  "a":["á","à","â","ä","ã","å"],
  "e":["é","è","ê","ë"],
  "i":["í","ì","î","ï"],
  "o":["ó","ò","ô","ö","õ"],
  "u":["ú","ù","û","ü"],
  "n":["ñ"],"c":["ç"],"s":["ß"],"z":["ž"],
]

private let emojiCategories: [(String,[String])] = [
  ("😊",["😀","😁","😂","🤣","😃","😄","😅","😆","😉","😊","😋","😎","😍","🥰","😘","🙂","🤗","🤩","🤔","😐","🙄","😏","😒","😔","😕","🙃","🤑","😲","😖","😞","😤","😢","😭","😨","😩","🤯","😬","😰","😱","😠","😡","🤬","😷","🤒","🤕","🤢","🤮","🤧","🥴","😵"]),
  ("👋",["👋","🤚","🖐","✋","🖖","👌","✌️","🤞","🤟","🤘","👈","👉","👆","👇","☝️","👍","👎","✊","👊","👏","🙌","🤝","🙏","✍️","💅","💪","🦾","👂","👃","👀"]),
  ("❤️",["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❣️","💕","💞","💓","💗","💖","💘","💝","✨","🌟","⭐","💫","🎉","🎊","🎈","🎁","🎂","🏆","🥇","🎖"]),
  ("🐶",["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯","🦁","🐮","🐷","🐸","🐵","🙈","🙉","🙊","🐔","🐧","🦆","🦅","🦉","🐺","🐴","🦄","🐝","🦋","🐌","🐞"]),
  ("🍎",["🍎","🍊","🍋","🍇","🍓","🍒","🍑","🥭","🍍","🥥","🥝","🍅","🍆","🥑","🥦","🌽","🥕","🍔","🍕","🌮","🍜","🍝","🍣","🍱","🍦","🍩","🎂","🍫","☕","🥤"]),
  ("⚽",["⚽","🏀","🏈","⚾","🥎","🏐","🏉","🎾","🎱","🏓","🏸","🥊","🥋","⛳","🎯","🎳","🏹","🎣","🎮","🕹"]),
]

// ── KeyButton ─────────────────────────────────────────────────

private final class KB: UIControl {
  private let lbl = UILabel()
  var onTap: (()->Void)?
  var onLong: (()->Void)?

  init(_ title: String, _ font: UIFont, _ fg: UIColor, _ bg: UIColor, radius: CGFloat = 5) {
    super.init(frame: .zero)
    backgroundColor = bg
    layer.cornerRadius = radius
    layer.shadowOpacity = 0
    clipsToBounds = false
    lbl.text = title; lbl.font = font; lbl.textColor = fg
    lbl.textAlignment = .center; lbl.isUserInteractionEnabled = false
    lbl.translatesAutoresizingMaskIntoConstraints = false
    addSubview(lbl)
    NSLayoutConstraint.activate([
      lbl.centerXAnchor.constraint(equalTo: centerXAnchor),
      lbl.centerYAnchor.constraint(equalTo: centerYAnchor),
    ])
    addTarget(self, action: #selector(tap),  for: .touchUpInside)
    addTarget(self, action: #selector(down), for: [.touchDown,.touchDragEnter])
    addTarget(self, action: #selector(up),   for: [.touchUpInside,.touchUpOutside,.touchCancel,.touchDragExit])
    let lp = UILongPressGestureRecognizer(target: self, action: #selector(longp(_:)))
    lp.minimumPressDuration = 0.35; addGestureRecognizer(lp)
  }
  required init?(coder: NSCoder) { fatalError() }
  func setTitle(_ t: String) { lbl.text = t }
  @objc private func tap()  { onTap?() }
  @objc private func longp(_ g: UILongPressGestureRecognizer) { if g.state == .began { onLong?() } }
  @objc private func down() { UIView.animate(withDuration:0.05){ self.transform = CGAffineTransform(scaleX:0.93,y:0.93); self.alpha = 0.7 } }
  @objc private func up()   { UIView.animate(withDuration:0.1){ self.transform = .identity; self.alpha = 1 } }
}

// ── EGChatKeyboardView ────────────────────────────────────────

@objc(EGChatKeyboardView)
final class EGChatKeyboardView: UIView {

  @objc var text: NSString = "" { didSet { cur = text as String } }
  @objc var onChangeText: RCTBubblingEventBlock?
  @objc var onSubmit:     RCTBubblingEventBlock?

  private var cur = ""
  private var nums = false
  private var caps = false
  private var lang = Lang.es
  private var emojis = false
  private var emojiCat = 0

  private let fb = UIImpactFeedbackGenerator(style: .light)
  private var popup: UIView?

  // Colores exactos del teclado iOS (modo claro)
  private var cBg:      UIColor { UIColor(red:0.67,green:0.70,blue:0.74,alpha:1) }
  private var cNorm:    UIColor { .white }
  private var cSpec:    UIColor { UIColor(red:0.67,green:0.70,blue:0.74,alpha:1) }
  private var cAccent:  UIColor { UIColor(red:0.0,green:0.70,blue:0.63,alpha:1) }
  private var cText:    UIColor { UIColor(red:0.07,green:0.07,blue:0.07,alpha:1) }

  // Fuentes exactas del sistema iOS
  private let fLetter  = UIFont.systemFont(ofSize: 22, weight: .light)
  private let fSpecial = UIFont.systemFont(ofSize: 16, weight: .regular)
  private let fBottom  = UIFont.systemFont(ofSize: 16, weight: .regular)
  private let fLang    = UIFont.systemFont(ofSize: 13, weight: .semibold)
  private let fShift   = UIFont.systemFont(ofSize: 20, weight: .regular)

  // Dimensiones iguales al sistema
  private let rowH:    CGFloat = 43
  private let hGap:    CGFloat = 6
  private let vGap:    CGFloat = 8
  private let side:    CGFloat = 3
  private let topPad:  CGFloat = 8
  private let botPad:  CGFloat = 4

  // Contenedores
  private let kbView    = UIView()
  private let emojiRoot = UIView()

  override init(frame: CGRect) { super.init(frame: frame); setup() }
  required init?(coder: NSCoder) { super.init(coder: coder); setup() }

  private func setup() {
    backgroundColor = cBg
    fb.prepare()
    for v in [kbView, emojiRoot] {
      v.translatesAutoresizingMaskIntoConstraints = false
      addSubview(v)
      NSLayoutConstraint.activate([
        v.topAnchor.constraint(equalTo: topAnchor),
        v.bottomAnchor.constraint(equalTo: bottomAnchor),
        v.leadingAnchor.constraint(equalTo: leadingAnchor),
        v.trailingAnchor.constraint(equalTo: trailingAnchor),
      ])
    }
    emojiRoot.isHidden = true
    render()
  }

  // ── Render teclado ────────────────────────────────────────

  private func render() {
    kbView.subviews.forEach { $0.removeFromSuperview() }
    kbView.backgroundColor = cBg

    let W = UIScreen.main.bounds.width
    var y = topPad

    if !nums {
      // Fila de idiomas
      y = addLangRow(y: y, W: W)
      y += vGap
      // Filas de letras
      let rows = letters[lang] ?? letters[.es]!
      // Fila 1 (10 teclas)
      y = addLetterRow(rows[0], y: y, W: W, centered: false)
      y += vGap
      // Fila 2 (9-10 teclas, centrada)
      y = addLetterRow(rows[1], y: y, W: W, centered: true)
      y += vGap
      // Fila 3 (shift + letras + borrar)
      y = addShiftRow(rows[2], y: y, W: W)
      y += vGap
      // Fila inferior
      addBottomRow(y: y, W: W)
    } else {
      // Números
      y = addNumRow(numRow1, y: y, W: W)
      y += vGap
      y = addNumRow(numRow2, y: y, W: W)
      y += vGap
      y = addNumSpecRow(y: y, W: W)
      y += vGap
      addNumBottomRow(y: y, W: W)
    }
  }

  // ── Fila de idiomas ───────────────────────────────────────

  @discardableResult
  private func addLangRow(y: CGFloat, W: CGFloat) -> CGFloat {
    let h: CGFloat = 30
    let gap: CGFloat = hGap
    let btnW = (W - side*2 - gap*2) / 3
    for (i, l) in Lang.allCases.enumerated() {
      let active = l == lang
      let btn = KB(l.rawValue, fLang,
                   active ? .white : cText,
                   active ? cAccent : cSpec, radius: 8)
      btn.frame = CGRect(x: side + CGFloat(i)*(btnW+gap), y: y, width: btnW, height: h)
      let ll = l
      btn.onTap = { [weak self] in self?.lang = ll; self?.render() }
      kbView.addSubview(btn)
    }
    return y + h
  }

  // ── Fila de letras ────────────────────────────────────────

  @discardableResult
  private func addLetterRow(_ keys: [String], y: CGFloat, W: CGFloat, centered: Bool) -> CGFloat {
    let n = CGFloat(keys.count)
    let totalGap = hGap * (n - 1)
    let keyW = (W - side*2 - totalGap) / n
    let startX: CGFloat
    if centered {
      let used = n * keyW + totalGap
      startX = (W - used) / 2
    } else {
      startX = side
    }
    for (i, k) in keys.enumerated() {
      let title = caps ? k.uppercased() : k
      let btn = KB(title, fLetter, cText, cNorm)
      btn.frame = CGRect(x: startX + CGFloat(i)*(keyW+hGap), y: y, width: keyW, height: rowH)
      btn.accessibilityIdentifier = k
      btn.onTap = { [weak self] in self?.handle(k) }
      if accentMap[k] != nil {
        btn.onLong = { [weak self] in
          guard let self else { return }
          let base = self.caps ? k.uppercased() : k
          let vars = accentMap[k]!.map { self.caps ? $0.uppercased() : $0 }
          self.fb.impactOccurred(intensity: 0.6)
          self.showPopup([base]+vars, from: btn)
        }
      }
      kbView.addSubview(btn)
    }
    return y + rowH
  }

  // ── Fila shift + letras + borrar ──────────────────────────

  @discardableResult
  private func addShiftRow(_ keys: [String], y: CGFloat, W: CGFloat) -> CGFloat {
    let specialW: CGFloat = 44
    let n = CGFloat(keys.count)
    let available = W - side*2 - 2*(specialW + hGap) - hGap*(n-1)
    let keyW = available / n
    let startX = side + specialW + hGap

    // Shift — blanco con flecha negra (igual al sistema iOS)
    let shift = KB(caps ? "⬆︎" : "⇧", fShift, UIColor(red:0.07,green:0.07,blue:0.07,alpha:1), cNorm)
    shift.frame = CGRect(x: side, y: y, width: specialW, height: rowH)
    shift.onTap = { [weak self] in self?.caps.toggle(); self?.render() }
    kbView.addSubview(shift)

    // Letras
    for (i, k) in keys.enumerated() {
      let title = caps ? k.uppercased() : k
      let btn = KB(title, fLetter, cText, cNorm)
      btn.frame = CGRect(x: startX + CGFloat(i)*(keyW+hGap), y: y, width: keyW, height: rowH)
      btn.accessibilityIdentifier = k
      btn.onTap = { [weak self] in self?.handle(k) }
      kbView.addSubview(btn)
    }

    // Borrar — icono SF Symbol igual al sistema iOS
    let del = makeDeleteKey(x: W - side - specialW, y: y, w: specialW, h: rowH)
    del.onTap = { [weak self] in
      guard let self, !self.cur.isEmpty else { return }
      self.cur.removeLast(); self.emit()
    }
    // Press largo para borrar rápido
    del.onLong = { [weak self] in
      self?.startFastDelete()
    }
    kbView.addSubview(del)

    return y + rowH
  }

  // Borrado rápido al mantener pulsado ⌫
  private var deleteTimer: Timer?

  /// Crea la tecla de borrar con el icono SF Symbol del sistema
  private func makeDeleteKey(x: CGFloat, y: CGFloat, w: CGFloat, h: CGFloat) -> UIControl {
    let btn = KB("", fSpecial, cText, cSpec)
    btn.frame = CGRect(x: x, y: y, width: w, height: h)
    // Icono SF Symbol "delete.backward" igual al sistema
    let img = UIImageView()
    let config = UIImage.SymbolConfiguration(pointSize: 17, weight: .regular)
    img.image = UIImage(systemName: "delete.backward", withConfiguration: config)
    img.tintColor = cText
    img.contentMode = .scaleAspectFit
    img.translatesAutoresizingMaskIntoConstraints = false
    btn.addSubview(img)
    NSLayoutConstraint.activate([
      img.centerXAnchor.constraint(equalTo: btn.centerXAnchor),
      img.centerYAnchor.constraint(equalTo: btn.centerYAnchor),
      img.widthAnchor.constraint(equalToConstant: 24),
      img.heightAnchor.constraint(equalToConstant: 20),
    ])
    btn.onTap = { [weak self] in
      guard let self, !self.cur.isEmpty else { return }
      self.cur.removeLast(); self.emit()
    }
    btn.onLong = { [weak self] in self?.startFastDelete() }
    kbView.addSubview(btn)
    return btn
  }
  private func startFastDelete() {
    deleteTimer?.invalidate()
    deleteTimer = Timer.scheduledTimer(withTimeInterval: 0.08, repeats: true) { [weak self] _ in
      guard let self, !self.cur.isEmpty else { self?.deleteTimer?.invalidate(); return }
      self.cur.removeLast(); self.emit()
    }
  }
  private func stopFastDelete() { deleteTimer?.invalidate(); deleteTimer = nil }

  // ── Fila inferior ─────────────────────────────────────────

  private func addBottomRow(y: CGFloat, W: CGFloat) {
    let h = rowH
    let numW: CGFloat  = 44
    let emoW: CGFloat  = 44
    let introW: CGFloat = 88
    let spaceW = W - side*2 - numW - emoW - introW - hGap*3

    let num = KB("123", fSpecial, cText, cSpec)
    num.frame = CGRect(x: side, y: y, width: numW, height: h)
    num.onTap = { [weak self] in self?.nums = true; self?.render() }
    kbView.addSubview(num)

    let emo = KB("😊", UIFont.systemFont(ofSize: 24), cText, cSpec)
    emo.frame = CGRect(x: side+numW+hGap, y: y, width: emoW, height: h)
    emo.onTap = { [weak self] in self?.emojis = true; self?.showEmojis() }
    kbView.addSubview(emo)

    let space = KB("espacio", fBottom, cText, cSpec)
    space.frame = CGRect(x: side+numW+emoW+hGap*2, y: y, width: spaceW, height: h)
    space.onTap = { [weak self] in self?.cur.append(" "); self?.emit() }
    kbView.addSubview(space)

    let intro = KB("intro", fBottom, .white, cAccent, radius: 5)
    intro.frame = CGRect(x: W-side-introW, y: y, width: introW, height: h)
    intro.onTap = { [weak self] in self?.onSubmit?([:]) }
    kbView.addSubview(intro)
  }

  // ── Filas numéricas ───────────────────────────────────────

  @discardableResult
  private func addNumRow(_ keys: [String], y: CGFloat, W: CGFloat) -> CGFloat {
    let n = CGFloat(keys.count)
    let keyW = (W - side*2 - hGap*(n-1)) / n
    for (i,k) in keys.enumerated() {
      let btn = KB(k, fLetter, cText, cNorm)
      btn.frame = CGRect(x: side+CGFloat(i)*(keyW+hGap), y: y, width: keyW, height: rowH)
      btn.onTap = { [weak self] in self?.handle(k) }
      kbView.addSubview(btn)
    }
    return y + rowH
  }

  @discardableResult
  private func addNumSpecRow(y: CGFloat, W: CGFloat) -> CGFloat {
    let keys = numRow3
    let abcW: CGFloat = 44
    let delW: CGFloat = 44
    let n = CGFloat(keys.count)
    let available = W - side*2 - 2*(abcW+hGap) - hGap*(n-1)
    let keyW = available / n
    let startX = side + abcW + hGap

    let abc = KB("ABC", fSpecial, cText, cSpec)
    abc.frame = CGRect(x: side, y: y, width: abcW, height: rowH)
    abc.onTap = { [weak self] in self?.nums = false; self?.render() }
    kbView.addSubview(abc)

    for (i,k) in keys.enumerated() {
      let btn = KB(k, fLetter, cText, cNorm)
      btn.frame = CGRect(x: startX+CGFloat(i)*(keyW+hGap), y: y, width: keyW, height: rowH)
      btn.onTap = { [weak self] in self?.handle(k) }
      kbView.addSubview(btn)
    }

    let del = KB("⌫", fSpecial, cText, cSpec)
    del.frame = CGRect(x: W-side-delW, y: y, width: delW, height: rowH)
    del.onTap = { [weak self] in guard let self, !self.cur.isEmpty else { return }; self.cur.removeLast(); self.emit() }
    kbView.addSubview(del)

    return y + rowH
  }

  private func addNumBottomRow(y: CGFloat, W: CGFloat) {
    let h = rowH
    let abcW: CGFloat = 44
    let dotW: CGFloat = 44
    let introW: CGFloat = 88
    let spaceW = W - side*2 - abcW - dotW - introW - hGap*3

    let abc = KB("ABC", fSpecial, cText, cSpec)
    abc.frame = CGRect(x: side, y: y, width: abcW, height: h)
    abc.onTap = { [weak self] in self?.nums = false; self?.render() }
    kbView.addSubview(abc)

    let emo = KB("😊", UIFont.systemFont(ofSize: 24), cText, cSpec)
    emo.frame = CGRect(x: side+abcW+hGap, y: y, width: dotW, height: h)
    emo.onTap = { [weak self] in self?.emojis = true; self?.showEmojis() }
    kbView.addSubview(emo)

    let space = KB("espacio", fBottom, cText, cSpec)
    space.frame = CGRect(x: side+abcW+dotW+hGap*2, y: y, width: spaceW, height: h)
    space.onTap = { [weak self] in self?.cur.append(" "); self?.emit() }
    kbView.addSubview(space)

    let intro = KB("intro", fBottom, .white, cAccent, radius: 5)
    intro.frame = CGRect(x: W-side-introW, y: y, width: introW, height: h)
    intro.onTap = { [weak self] in self?.onSubmit?([:]) }
    kbView.addSubview(intro)
  }

  // ── Panel emojis ──────────────────────────────────────────

  private func showEmojis() {
    kbView.isHidden = true
    emojiRoot.isHidden = false
    buildEmojis()
  }

  private func buildEmojis() {
    emojiRoot.subviews.forEach { $0.removeFromSuperview() }
    emojiRoot.backgroundColor = UIColor(red:0.14,green:0.14,blue:0.16,alpha:1)

    let barH: CGFloat = 44
    let bar = UIScrollView()
    bar.showsHorizontalScrollIndicator = false
    bar.frame = CGRect(x: 0, y: 6, width: bounds.width, height: barH)
    emojiRoot.addSubview(bar)

    var bx: CGFloat = 4
    for (i,(icon,_)) in emojiCategories.enumerated() {
      let b = KB(icon, UIFont.systemFont(ofSize: 22), .label,
                 i == emojiCat ? .white.withAlphaComponent(0.15) : .clear, radius: 8)
      b.frame = CGRect(x: bx, y: 0, width: 42, height: barH)
      let idx = i; b.onTap = { [weak self] in self?.emojiCat = idx; self?.buildEmojis() }
      bar.addSubview(b); bx += 46
    }
    let back = KB("⌨️", UIFont.systemFont(ofSize: 20), .label,
                  UIColor(red:0.22,green:0.22,blue:0.24,alpha:1), radius: 8)
    back.frame = CGRect(x: bx, y: 0, width: 42, height: barH)
    back.onTap = { [weak self] in self?.emojis = false; self?.emojiRoot.isHidden = true; self?.kbView.isHidden = false }
    bar.addSubview(back); bx += 46
    bar.contentSize = CGSize(width: bx, height: barH)

    let emList = emojiCategories[emojiCat].1
    let scroll = UIScrollView()
    scroll.showsVerticalScrollIndicator = false
    scroll.frame = CGRect(x: 6, y: 6+barH+4, width: bounds.width-12, height: bounds.height-barH-16)
    emojiRoot.addSubview(scroll)

    let cols = 8
    let cw = (bounds.width - 12) / CGFloat(cols)
    let rows = Int(ceil(Double(emList.count)/Double(cols)))
    let grid = UIView(frame: CGRect(x:0, y:0, width: scroll.frame.width, height: CGFloat(rows)*cw))
    scroll.addSubview(grid); scroll.contentSize = grid.frame.size

    for (i,e) in emList.enumerated() {
      let col = i%cols, row = i/cols
      let b = KB(e, UIFont.systemFont(ofSize: 27), .label, .clear, radius: 8)
      b.frame = CGRect(x: CGFloat(col)*cw, y: CGFloat(row)*cw, width: cw, height: cw)
      let em = e; b.onTap = { [weak self] in self?.fb.impactOccurred(intensity:0.28); self?.cur.append(em); self?.emit() }
      grid.addSubview(b)
    }
  }

  // ── Popup acentos ─────────────────────────────────────────

  private func showPopup(_ variants: [String], from src: UIView) {
    popup?.removeFromSuperview()
    let bW: CGFloat = 38, bH: CGFloat = 46, pad: CGFloat = 6
    let total = CGFloat(variants.count)*(bW+pad)+pad
    let pop = UIView()
    pop.backgroundColor = UIColor(red:0.18,green:0.18,blue:0.20,alpha:0.97)
    pop.layer.cornerRadius = 12
    pop.translatesAutoresizingMaskIntoConstraints = false
    kbView.addSubview(pop)

    let stack = UIStackView(); stack.axis = .horizontal; stack.spacing = pad
    stack.translatesAutoresizingMaskIntoConstraints = false
    pop.addSubview(stack)

    for v in variants {
      let b = KB(v, UIFont.systemFont(ofSize:21,weight:.medium), .white, .clear)
      b.widthAnchor.constraint(equalToConstant:bW).isActive = true
      b.heightAnchor.constraint(equalToConstant:bH).isActive = true
      let ch = v; b.onTap = { [weak self] in
        self?.cur.append(ch); self?.emit()
        self?.popup?.removeFromSuperview(); self?.popup = nil
        if self?.caps == true { self?.caps = false; self?.render() }
      }
      stack.addArrangedSubview(b)
    }
    NSLayoutConstraint.activate([
      stack.leadingAnchor.constraint(equalTo:pop.leadingAnchor,constant:pad),
      stack.trailingAnchor.constraint(equalTo:pop.trailingAnchor,constant:-pad),
      stack.topAnchor.constraint(equalTo:pop.topAnchor,constant:4),
      stack.bottomAnchor.constraint(equalTo:pop.bottomAnchor,constant:-4),
    ])
    let f = src.convert(src.bounds, to: kbView)
    var x = f.midX - total/2; x = max(4, min(x, kbView.bounds.width-total-4))
    NSLayoutConstraint.activate([
      pop.leadingAnchor.constraint(equalTo:kbView.leadingAnchor,constant:x),
      pop.topAnchor.constraint(equalTo:kbView.topAnchor,constant:max(4,f.minY-bH-10)),
      pop.widthAnchor.constraint(equalToConstant:total),
    ])
    pop.alpha = 0; UIView.animate(withDuration:0.13){ pop.alpha = 1 }
    popup = pop
  }

  // ── Manejo ────────────────────────────────────────────────

  private func handle(_ k: String) {
    fb.impactOccurred(intensity:0.35); fb.prepare()
    popup?.removeFromSuperview(); popup = nil
    let ch = (caps && !nums) ? k.uppercased() : k
    cur.append(ch)
    if caps && !nums { caps = false; render() }
    emit()
  }

  private func emit() { onChangeText?(["text": cur]) }
}
