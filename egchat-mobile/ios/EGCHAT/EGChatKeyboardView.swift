import UIKit
import React

// ─────────────────────────────────────────────────────────────
// MARK: - Manager
// ─────────────────────────────────────────────────────────────

@objc(EGChatKeyboardViewManager)
final class EGChatKeyboardViewManager: RCTViewManager {
  override func view() -> UIView! { EGChatKeyboardView() }
  override static func requiresMainQueueSetup() -> Bool { true }
}

// ─────────────────────────────────────────────────────────────
// MARK: - Constantes de dimensiones (idénticas al sistema iOS)
// ─────────────────────────────────────────────────────────────

private enum KBLayout {
  // Altura de cada fila de teclas (igual al sistema)
  static let rowH: CGFloat      = 42
  // Separación horizontal entre teclas
  static let hGap: CGFloat      = 6
  // Separación vertical entre filas
  static let vGap: CGFloat      = 8
  // Padding lateral del teclado
  static let sidePad: CGFloat   = 3
  // Padding superior
  static let topPad: CGFloat    = 10
  // Padding inferior (encima del home indicator)
  static let botPad: CGFloat    = 4
  // Radio de esquina de las teclas
  static let radius: CGFloat    = 5
  // Fuente letras normales
  static let letterFont         = UIFont.systemFont(ofSize: 22, weight: .regular)
  // Fuente teclas especiales
  static let specialFont        = UIFont.systemFont(ofSize: 16, weight: .regular)
  // Fuente tecla espacio / intro
  static let bottomFont         = UIFont.systemFont(ofSize: 16, weight: .regular)
  // Fuente selector de idioma
  static let langFont           = UIFont.systemFont(ofSize: 13, weight: .semibold)
}

// ─────────────────────────────────────────────────────────────
// MARK: - Colores adaptativos (claro / oscuro)
// ─────────────────────────────────────────────────────────────

private struct KC {
  static var bg: UIColor {
    UIColor { t in t.userInterfaceStyle == .dark
      ? UIColor(red:0.17, green:0.17, blue:0.18, alpha:1)
      : UIColor(red:0.67, green:0.70, blue:0.75, alpha:1) }
  }
  static var normalKey: UIColor {
    UIColor { t in t.userInterfaceStyle == .dark
      ? UIColor(red:0.29, green:0.29, blue:0.31, alpha:1)
      : UIColor.white }
  }
  static var specialKey: UIColor {
    UIColor { t in t.userInterfaceStyle == .dark
      ? UIColor(red:0.18, green:0.18, blue:0.19, alpha:1)
      : UIColor(red:0.67, green:0.70, blue:0.75, alpha:1) }
  }
  static var keyText: UIColor { .label }
  static var accent: UIColor  { UIColor(red:0.0, green:0.70, blue:0.63, alpha:1) }
  static var shadow: UIColor  {
    UIColor { t in t.userInterfaceStyle == .dark ? .clear : UIColor(red:0,green:0,blue:0,alpha:0.35) }
  }
}

// ─────────────────────────────────────────────────────────────
// MARK: - Layouts por idioma
// ─────────────────────────────────────────────────────────────

private enum Lang: String, CaseIterable { case es = "ES", en = "EN", fr = "FR" }

private let letterRows: [Lang: [[String]]] = [
  .es: [
    ["q","w","e","r","t","y","u","i","o","p"],
    ["a","s","d","f","g","h","j","k","l","ñ"],
    ["⇧","z","x","c","v","b","n","m","⌫"],
    ["123","😊","espacio","↵"],
  ],
  .en: [
    ["q","w","e","r","t","y","u","i","o","p"],
    ["a","s","d","f","g","h","j","k","l"],
    ["⇧","z","x","c","v","b","n","m","⌫"],
    ["123","😊","espacio","↵"],
  ],
  .fr: [
    ["a","z","e","r","t","y","u","i","o","p"],
    ["q","s","d","f","g","h","j","k","l","m"],
    ["⇧","w","x","c","v","b","n","⌫"],
    ["123","😊","espacio","↵"],
  ],
]

private let numberRows: [[String]] = [
  ["1","2","3","4","5","6","7","8","9","0"],
  ["-","/",":",";","(",")","\u{20AC}","&","@","\""],
  ["ABC",".",",","?","!","'","⌫"],
  ["ABC","😊","espacio","↵"],
]

private let accentMap: [String:[String]] = [
  "a":["á","à","â","ä","ã","å"],
  "e":["é","è","ê","ë"],
  "i":["í","ì","î","ï"],
  "o":["ó","ò","ô","ö","õ"],
  "u":["ú","ù","û","ü"],
  "n":["ñ"], "c":["ç"], "s":["ß","š"], "z":["ž"],
]

private let emojiCategories: [(String,[String])] = [
  ("😊",["😀","😁","😂","🤣","😃","😄","😅","😆","😉","😊",
         "😋","😎","😍","🥰","😘","🙂","🤗","🤩","🤔","😐",
         "🙄","😏","😒","😔","😕","🙃","🤑","😲","😖","😞",
         "😤","😢","😭","😨","😩","🤯","😬","😰","😱","🥵",
         "😠","😡","🤬","😷","🤒","🤕","🤢","🤮","🤧","🥴"]),
  ("👋",["👋","🤚","🖐","✋","🖖","👌","✌️","🤞","🤟","🤘",
         "👈","👉","👆","👇","☝️","👍","👎","✊","👊","👏",
         "🙌","🤝","🙏","✍️","💅","💪","🦾","👂","👃","👀"]),
  ("❤️",["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔",
         "❣️","💕","💞","💓","💗","💖","💘","💝","✨","🌟",
         "⭐","💫","🎉","🎊","🎈","🎁","🎂","🏆","🥇","🎖"]),
  ("🐶",["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯",
         "🦁","🐮","🐷","🐸","🐵","🙈","🙉","🙊","🐔","🐧",
         "🦆","🦅","🦉","🐺","🐴","🦄","🐝","🦋","🐌","🐞"]),
  ("🍎",["🍎","🍊","🍋","🍇","🍓","🍒","🍑","🥭","🍍","🥥",
         "🥝","🍅","🍆","🥑","🥦","🌽","🥕","🍔","🍕","🌮",
         "🍜","🍝","🍣","🍱","🍦","🍩","🎂","🍫","☕","🥤"]),
  ("⚽",["⚽","🏀","🏈","⚾","🥎","🏐","🏉","🎾","🎱","🏓",
         "🏸","🥊","🥋","⛳","🎯","🎳","🏹","🎣","🎮","🕹"]),
  ("🚗",["🚗","🚕","🚙","🚌","🏎","🚓","🚑","🚒","🛻","🚚",
         "🏍","🛵","🚲","🛴","🚁","✈️","🚀","🛸","🚂","🚢"]),
  ("💡",["💡","🔦","💻","🖥","📱","☎️","📷","📹","🔭","🔬",
         "🧲","🔧","🔨","⚙️","🔑","🔐","🔒","🔓","📦","📬"]),
]

// ─────────────────────────────────────────────────────────────
// MARK: - KeyButton (UIControl + UILabel — sin subrayado)
// ─────────────────────────────────────────────────────────────

private final class KeyButton: UIControl {
  private let label = UILabel()
  var onTap: (()->Void)?
  var onLongPress: (()->Void)?

  init(title: String, font: UIFont, textColor: UIColor,
       bg: UIColor, radius: CGFloat = KBLayout.radius,
       shadow: Bool = false) {
    super.init(frame: .zero)
    backgroundColor = bg
    layer.cornerRadius = radius
    layer.shadowOpacity = 0
    layer.borderWidth   = 0
    clipsToBounds = false

    if shadow {
      layer.shadowColor   = KC.shadow.cgColor
      layer.shadowOffset  = CGSize(width: 0, height: 1)
      layer.shadowRadius  = 0
      layer.shadowOpacity = 1
    }

    label.text          = title
    label.font          = font
    label.textColor     = textColor
    label.textAlignment = .center
    label.translatesAutoresizingMaskIntoConstraints = false
    addSubview(label)
    NSLayoutConstraint.activate([
      label.centerXAnchor.constraint(equalTo: centerXAnchor),
      label.centerYAnchor.constraint(equalTo: centerYAnchor),
    ])

    addTarget(self, action: #selector(tapped),    for: .touchUpInside)
    addTarget(self, action: #selector(pressDown), for: [.touchDown,.touchDragEnter])
    addTarget(self, action: #selector(pressUp),   for: [.touchUpInside,.touchUpOutside,.touchCancel,.touchDragExit])

    let lp = UILongPressGestureRecognizer(target: self, action: #selector(longPressed(_:)))
    lp.minimumPressDuration = 0.35
    addGestureRecognizer(lp)
  }
  required init?(coder: NSCoder) { fatalError() }

  func setTitle(_ t: String) { label.text = t }

  @objc private func tapped()       { onTap?() }
  @objc private func longPressed(_ gr: UILongPressGestureRecognizer) {
    if gr.state == .began { onLongPress?() }
  }
  @objc private func pressDown() {
    UIView.animate(withDuration: 0.05) {
      self.transform = CGAffineTransform(scaleX: 0.92, y: 0.92)
      self.alpha = 0.7
    }
  }
  @objc private func pressUp() {
    UIView.animate(withDuration: 0.1) {
      self.transform = .identity
      self.alpha = 1
    }
  }
}

// ─────────────────────────────────────────────────────────────
// MARK: - EGChatKeyboardView
// ─────────────────────────────────────────────────────────────

@objc(EGChatKeyboardView)
final class EGChatKeyboardView: UIView {

  @objc var text: NSString = "" { didSet { currentText = text as String } }
  @objc var onChangeText: RCTBubblingEventBlock?
  @objc var onSubmit:     RCTBubblingEventBlock?

  private var currentText   = ""
  private var isNumbers     = false
  private var isUppercase   = false
  private var currentLang   = Lang.es
  private var showingEmojis = false
  private var emojiCat      = 0

  private let mainStack  = UIStackView()
  private let emojiView  = UIView()
  private let feedback   = UIImpactFeedbackGenerator(style: .light)
  private var accentPopup: UIView?

  override init(frame: CGRect) { super.init(frame: frame); build() }
  required init?(coder: NSCoder) { super.init(coder: coder); build() }

  private func build() {
    backgroundColor = KC.bg
    feedback.prepare()
    buildMainStack()
    buildEmojiContainer()
    switchTo(emojis: false)
  }

  // ── Modo oscuro dinámico ──────────────────────────────────

  override func traitCollectionDidChange(_ prev: UITraitCollection?) {
    super.traitCollectionDidChange(prev)
    backgroundColor = KC.bg
    if !showingEmojis { renderKeys() }
  }

  // ─────────────────────────────────────────────────────────
  // MARK: Teclado principal
  // ─────────────────────────────────────────────────────────

  private func buildMainStack() {
    mainStack.axis        = .vertical
    mainStack.spacing     = KBLayout.vGap
    mainStack.distribution = .fillEqually
    mainStack.translatesAutoresizingMaskIntoConstraints = false
    addSubview(mainStack)
    NSLayoutConstraint.activate([
      mainStack.leadingAnchor.constraint(equalTo: leadingAnchor,  constant: KBLayout.sidePad),
      mainStack.trailingAnchor.constraint(equalTo: trailingAnchor, constant: -KBLayout.sidePad),
      mainStack.topAnchor.constraint(equalTo: topAnchor, constant: KBLayout.topPad),
      mainStack.bottomAnchor.constraint(equalTo: safeAreaLayoutGuide.bottomAnchor, constant: -KBLayout.botPad),
    ])
  }

  private func renderKeys() {
    mainStack.arrangedSubviews.forEach { $0.removeFromSuperview() }

    let rows = isNumbers ? numberRows : (letterRows[currentLang] ?? letterRows[.es]!)
    for keys in rows {
      let row = UIStackView()
      row.axis         = .horizontal
      row.spacing      = KBLayout.hGap
      row.distribution = .fillProportionally
      for key in keys { row.addArrangedSubview(makeKey(key)) }
      mainStack.addArrangedSubview(row)
    }
    if !isNumbers { insertLangRow() }
  }

  private func insertLangRow() {
    let row = UIStackView()
    row.axis         = .horizontal
    row.spacing      = KBLayout.hGap
    row.distribution = .fillEqually

    for lang in Lang.allCases {
      let active = lang == currentLang
      let btn = KeyButton(
        title: lang.rawValue, font: KBLayout.langFont,
        textColor: active ? .white : KC.keyText,
        bg: active ? KC.accent : KC.specialKey,
        radius: KBLayout.radius
      )
      btn.translatesAutoresizingMaskIntoConstraints = false
      btn.heightAnchor.constraint(equalToConstant: 28).isActive = true
      let l = lang
      btn.onTap = { [weak self] in self?.currentLang = l; self?.renderKeys() }
      row.addArrangedSubview(btn)
    }
    mainStack.insertArrangedSubview(row, at: 0)
  }

  // ── Crear tecla ───────────────────────────────────────────

  private func makeKey(_ key: String) -> KeyButton {
    let isSpec = isSpecial(key)
    let isSend = key == "↵"
    let isShift = key == "⇧"

    let font: UIFont
    if key.count == 1 && !isSpec { font = KBLayout.letterFont }
    else if key == "espacio" || key == "↵" || key == "123" || key == "ABC" { font = KBLayout.bottomFont }
    else { font = KBLayout.specialFont }

    let bg  = isSend ? KC.accent : isSpec ? KC.specialKey : KC.normalKey
    let fg  = isSend ? UIColor.white : KC.keyText

    let btn = KeyButton(title: display(key), font: font,
                        textColor: fg, bg: bg,
                        radius: KBLayout.radius, shadow: !isSpec)
    btn.translatesAutoresizingMaskIntoConstraints = false
    let w = fixedWidth(key)
    if w > 0 { btn.widthAnchor.constraint(equalToConstant: w).isActive = true }
    btn.accessibilityIdentifier = key
    btn.onTap = { [weak self] in self?.handle(key) }

    if accentMap[key.lowercased()] != nil {
      btn.onLongPress = { [weak self] in
        guard let self else { return }
        let base = self.isUppercase ? key.uppercased() : key
        let vars = accentMap[key.lowercased()]!.map { self.isUppercase ? $0.uppercased() : $0 }
        self.feedback.impactOccurred(intensity: 0.6)
        self.showAccentPopup([base] + vars, from: btn)
      }
    }
    return btn
  }

  private func display(_ key: String) -> String {
    switch key {
    case "⇧":     return isUppercase ? "⬆︎" : "⇧"
    case "espacio": return "espacio"
    case "↵":      return "intro"
    case "😊":     return "😊"
    default:
      return (key.count == 1 && !isNumbers && isUppercase) ? key.uppercased() : key
    }
  }

  private func isSpecial(_ k: String) -> Bool {
    ["123","ABC","⌫","⇧","↵","😊","espacio"].contains(k)
  }

  private func fixedWidth(_ k: String) -> CGFloat {
    switch k {
    case "espacio": return 0   // flex
    case "↵":       return 90
    case "123","ABC": return 44
    case "⇧":        return 44
    case "⌫":        return 44
    case "😊":       return 44
    default:         return 0
    }
  }

  // ── Manejo de teclas ──────────────────────────────────────

  private func handle(_ key: String) {
    feedback.impactOccurred(intensity: 0.35)
    feedback.prepare()
    dismissAccentPopup()
    switch key {
    case "123":     isNumbers = true;  renderKeys()
    case "ABC":     isNumbers = false; renderKeys()
    case "⇧":      isUppercase.toggle(); renderKeys()
    case "⌫":
      if !currentText.isEmpty { currentText.removeLast(); emitChange() }
    case "espacio": currentText.append(" "); emitChange()
    case "↵":       onSubmit?([:])
    case "😊":      switchTo(emojis: true)
    default:
      let ch = (isUppercase && !isNumbers) ? key.uppercased() : key
      currentText.append(ch)
      if isUppercase && !isNumbers { isUppercase = false; renderKeys() }
      emitChange()
    }
  }

  private func emitChange() { onChangeText?(["text": currentText]) }

  // ─────────────────────────────────────────────────────────
  // MARK: Popup acentos
  // ─────────────────────────────────────────────────────────

  private func showAccentPopup(_ variants: [String], from src: UIView) {
    dismissAccentPopup()
    let bW: CGFloat = 38, bH: CGFloat = 46, pad: CGFloat = 6
    let total = CGFloat(variants.count) * (bW + pad) + pad

    let pop = UIView()
    pop.backgroundColor = UIColor(red:0.18,green:0.18,blue:0.20,alpha:0.97)
    pop.layer.cornerRadius = 12
    pop.translatesAutoresizingMaskIntoConstraints = false

    let stack = UIStackView()
    stack.axis = .horizontal; stack.spacing = pad
    stack.translatesAutoresizingMaskIntoConstraints = false
    pop.addSubview(stack)

    for v in variants {
      let b = KeyButton(title: v, font: UIFont.systemFont(ofSize: 21, weight: .medium),
                        textColor: .white, bg: .clear)
      b.widthAnchor.constraint(equalToConstant: bW).isActive = true
      b.heightAnchor.constraint(equalToConstant: bH).isActive = true
      let ch = v
      b.onTap = { [weak self] in
        self?.currentText.append(ch); self?.emitChange()
        self?.dismissAccentPopup()
        if self?.isUppercase == true { self?.isUppercase = false; self?.renderKeys() }
      }
      stack.addArrangedSubview(b)
    }

    NSLayoutConstraint.activate([
      stack.leadingAnchor.constraint(equalTo: pop.leadingAnchor, constant: pad),
      stack.trailingAnchor.constraint(equalTo: pop.trailingAnchor, constant: -pad),
      stack.topAnchor.constraint(equalTo: pop.topAnchor, constant: 4),
      stack.bottomAnchor.constraint(equalTo: pop.bottomAnchor, constant: -4),
    ])

    addSubview(pop)
    let f = src.convert(src.bounds, to: self)
    var x = f.midX - total / 2
    x = max(4, min(x, bounds.width - total - 4))
    NSLayoutConstraint.activate([
      pop.leadingAnchor.constraint(equalTo: leadingAnchor, constant: x),
      pop.topAnchor.constraint(equalTo: topAnchor, constant: max(4, f.minY - bH - 10)),
      pop.widthAnchor.constraint(equalToConstant: total),
    ])
    pop.alpha = 0
    UIView.animate(withDuration: 0.13) { pop.alpha = 1 }
    accentPopup = pop
  }

  private func dismissAccentPopup() { accentPopup?.removeFromSuperview(); accentPopup = nil }

  override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
    super.touchesBegan(touches, with: event)
    guard accentPopup != nil, let t = touches.first,
          accentPopup?.bounds.contains(t.location(in: accentPopup)) == false
    else { return }
    dismissAccentPopup()
  }

  // ─────────────────────────────────────────────────────────
  // MARK: Panel emojis
  // ─────────────────────────────────────────────────────────

  private func buildEmojiContainer() {
    emojiView.backgroundColor = KC.bg
    emojiView.translatesAutoresizingMaskIntoConstraints = false
    addSubview(emojiView)
    NSLayoutConstraint.activate([
      emojiView.leadingAnchor.constraint(equalTo: leadingAnchor),
      emojiView.trailingAnchor.constraint(equalTo: trailingAnchor),
      emojiView.topAnchor.constraint(equalTo: topAnchor),
      emojiView.bottomAnchor.constraint(equalTo: bottomAnchor),
    ])
    emojiView.isHidden = true
  }

  private func rebuildEmojis() {
    emojiView.subviews.forEach { $0.removeFromSuperview() }

    // Barra categorías
    let catBar = UIScrollView()
    catBar.showsHorizontalScrollIndicator = false
    catBar.translatesAutoresizingMaskIntoConstraints = false
    emojiView.addSubview(catBar)

    let catStack = UIStackView()
    catStack.axis = .horizontal; catStack.spacing = 4
    catStack.translatesAutoresizingMaskIntoConstraints = false
    catBar.addSubview(catStack)

    for (i,(icon,_)) in emojiCategories.enumerated() {
      let b = KeyButton(title: icon, font: UIFont.systemFont(ofSize: 22),
                        textColor: .label,
                        bg: i == emojiCat ? KC.accent.withAlphaComponent(0.25) : .clear,
                        radius: 8)
      b.widthAnchor.constraint(equalToConstant: 42).isActive = true
      b.heightAnchor.constraint(equalToConstant: 38).isActive = true
      let idx = i
      b.onTap = { [weak self] in self?.emojiCat = idx; self?.rebuildEmojis() }
      catStack.addArrangedSubview(b)
    }

    // Botón volver al teclado
    let back = KeyButton(title: "⌨️", font: UIFont.systemFont(ofSize: 20),
                         textColor: .label, bg: KC.specialKey, radius: 8)
    back.widthAnchor.constraint(equalToConstant: 42).isActive = true
    back.heightAnchor.constraint(equalToConstant: 38).isActive = true
    back.onTap = { [weak self] in self?.switchTo(emojis: false) }
    catStack.addArrangedSubview(back)

    NSLayoutConstraint.activate([
      catBar.leadingAnchor.constraint(equalTo: emojiView.leadingAnchor, constant: 4),
      catBar.trailingAnchor.constraint(equalTo: emojiView.trailingAnchor, constant: -4),
      catBar.topAnchor.constraint(equalTo: emojiView.topAnchor, constant: 6),
      catBar.heightAnchor.constraint(equalToConstant: 44),
      catStack.leadingAnchor.constraint(equalTo: catBar.leadingAnchor),
      catStack.trailingAnchor.constraint(equalTo: catBar.trailingAnchor),
      catStack.topAnchor.constraint(equalTo: catBar.topAnchor),
      catStack.bottomAnchor.constraint(equalTo: catBar.bottomAnchor),
      catStack.heightAnchor.constraint(equalTo: catBar.heightAnchor),
    ])

    // Grid emojis
    let emojis = emojiCategories[emojiCat].1
    let scroll = UIScrollView()
    scroll.showsVerticalScrollIndicator = false
    scroll.translatesAutoresizingMaskIntoConstraints = false
    emojiView.addSubview(scroll)
    NSLayoutConstraint.activate([
      scroll.leadingAnchor.constraint(equalTo: emojiView.leadingAnchor, constant: 6),
      scroll.trailingAnchor.constraint(equalTo: emojiView.trailingAnchor, constant: -6),
      scroll.topAnchor.constraint(equalTo: catBar.bottomAnchor, constant: 4),
      scroll.bottomAnchor.constraint(equalTo: emojiView.safeAreaLayoutGuide.bottomAnchor, constant: -4),
    ])

    let cols = 8
    let cellW = (UIScreen.main.bounds.width - 12) / CGFloat(cols)
    let rows  = Int(ceil(Double(emojis.count) / Double(cols)))

    let grid = UIView()
    grid.translatesAutoresizingMaskIntoConstraints = false
    scroll.addSubview(grid)
    NSLayoutConstraint.activate([
      grid.leadingAnchor.constraint(equalTo: scroll.leadingAnchor),
      grid.trailingAnchor.constraint(equalTo: scroll.trailingAnchor),
      grid.topAnchor.constraint(equalTo: scroll.topAnchor),
      grid.bottomAnchor.constraint(equalTo: scroll.bottomAnchor),
      grid.widthAnchor.constraint(equalTo: scroll.widthAnchor),
      grid.heightAnchor.constraint(equalToConstant: CGFloat(rows) * cellW),
    ])

    for (i,e) in emojis.enumerated() {
      let col = i % cols, row = i / cols
      let b = KeyButton(title: e, font: UIFont.systemFont(ofSize: 27),
                        textColor: .label, bg: .clear, radius: 8)
      b.frame = CGRect(x: CGFloat(col)*cellW, y: CGFloat(row)*cellW,
                       width: cellW, height: cellW)
      let em = e
      b.onTap = { [weak self] in
        self?.feedback.impactOccurred(intensity: 0.28)
        self?.currentText.append(em); self?.emitChange()
      }
      grid.addSubview(b)
    }
  }

  // ─────────────────────────────────────────────────────────
  // MARK: Alternar vistas
  // ─────────────────────────────────────────────────────────

  private func switchTo(emojis: Bool) {
    showingEmojis = emojis
    if emojis {
      mainStack.isHidden = true
      emojiView.isHidden = false
      rebuildEmojis()
    } else {
      emojiView.isHidden = true
      mainStack.isHidden = false
      renderKeys()
    }
  }
}
