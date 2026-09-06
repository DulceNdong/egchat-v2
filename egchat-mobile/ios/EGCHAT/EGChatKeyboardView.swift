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

private let accentMap: [String: [String]] = [
  "a": ["á","à","â","ä","ã","å"],
  "e": ["é","è","ê","ë"],
  "i": ["í","ì","î","ï"],
  "o": ["ó","ò","ô","ö","õ"],
  "u": ["ú","ù","û","ü"],
  "n": ["ñ"],
  "c": ["ç"],
  "s": ["ß","š"],
  "z": ["ž"],
]

private let emojiCategories: [(String, [String])] = [
  ("😊", ["😀","😁","😂","🤣","😃","😄","😅","😆","😉","😊",
          "😋","😎","😍","🥰","😘","😗","😙","😚","🙂","🤗",
          "🤩","🤔","🤨","😐","😑","😶","🙄","😏","😣","😥",
          "😮","🤐","😯","😪","😫","🥱","😴","😌","😛","😜",
          "😝","🤤","😒","😓","😔","😕","🙃","🤑","😲","☹️",
          "🙁","😖","😞","😟","😤","😢","😭","😦","😧","😨",
          "😩","🤯","😬","😰","😱","🥵","🥶","😳","🤪","😵",
          "🥴","😠","😡","🤬","😷","🤒","🤕","🤢","🤮","🤧"]),
  ("👋", ["👋","🤚","🖐","✋","🖖","👌","🤌","✌️","🤞","🤟",
          "🤘","🤙","👈","👉","👆","🖕","👇","☝️","👍","👎",
          "✊","👊","🤛","🤜","👏","🙌","👐","🤲","🤝","🙏",
          "✍️","💅","🤳","💪","🦾","🦵","🦶","👂","🦻","👃"]),
  ("❤️", ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔",
          "❣️","💕","💞","💓","💗","💖","💘","💝","💟","☮️",
          "✨","🌟","⭐","💫","🎉","🎊","🎈","🎁","🎂","🏆"]),
  ("🐶", ["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯",
          "🦁","🐮","🐷","🐸","🐵","🙈","🙉","🙊","🐔","🐧",
          "🐦","🐤","🦆","🦅","🦉","🦇","🐺","🐴","🦄","🐝"]),
  ("🍎", ["🍎","🍊","🍋","🍇","🍓","🍒","🍑","🥭","🍍","🥥",
          "🥝","🍅","🍆","🥑","🥦","🌽","🥕","🍔","🍕","🌮",
          "🍜","🍝","🍣","🍱","🍦","🍩","🎂","🍫","☕","🥤"]),
  ("⚽", ["⚽","🏀","🏈","⚾","🥎","🏐","🏉","🎾","🎱","🏓",
          "🏸","🥊","🥋","⛳","🎯","🎳","🏹","🎣","🎮","🕹"]),
  ("🚗", ["🚗","🚕","🚙","🚌","🏎","🚓","🚑","🚒","🛻","🚚",
          "🏍","🛵","🚲","🛴","🚁","✈️","🚀","🛸","🚂","🚢"]),
  ("💡", ["💡","🔦","💻","🖥","📱","☎️","📷","📹","🔭","🔬",
          "🧲","🔧","🔨","⚙️","🔑","🔐","🔒","🔓","📦","📬"]),
]

// ─────────────────────────────────────────────────────────────
// MARK: - UILabel como tecla (sin subrayado)
// ─────────────────────────────────────────────────────────────

/// Usamos UIControl + UILabel para evitar el subrayado automático
/// que iOS aplica a UIButton(type: .system)
private final class KeyButton: UIControl {
  private let label = UILabel()
  var onTap: (() -> Void)?
  var onLongPress: (() -> Void)?

  init(title: String, fontSize: CGFloat, weight: UIFont.Weight,
       textColor: UIColor, bgColor: UIColor, radius: CGFloat = 10) {
    super.init(frame: .zero)
    backgroundColor = bgColor
    layer.cornerRadius = radius
    // Sin sombra, sin borde
    layer.shadowOpacity = 0
    layer.borderWidth = 0
    clipsToBounds = true

    label.text = title
    label.font = UIFont.systemFont(ofSize: fontSize, weight: weight)
    label.textColor = textColor
    label.textAlignment = .center
    label.translatesAutoresizingMaskIntoConstraints = false
    addSubview(label)
    NSLayoutConstraint.activate([
      label.centerXAnchor.constraint(equalTo: centerXAnchor),
      label.centerYAnchor.constraint(equalTo: centerYAnchor),
    ])

    addTarget(self, action: #selector(tapped), for: .touchUpInside)

    let lp = UILongPressGestureRecognizer(target: self, action: #selector(longPressed(_:)))
    lp.minimumPressDuration = 0.35
    addGestureRecognizer(lp)

    // Press visual
    addTarget(self, action: #selector(pressDown), for: [.touchDown, .touchDragEnter])
    addTarget(self, action: #selector(pressUp), for: [.touchUpInside, .touchUpOutside, .touchCancel, .touchDragExit])
  }

  required init?(coder: NSCoder) { fatalError() }

  func setTitle(_ t: String) { label.text = t }

  @objc private func tapped() { onTap?() }
  @objc private func longPressed(_ gr: UILongPressGestureRecognizer) {
    if gr.state == .began { onLongPress?() }
  }
  @objc private func pressDown() {
    UIView.animate(withDuration: 0.07) { self.alpha = 0.65; self.transform = CGAffineTransform(scaleX: 0.95, y: 0.95) }
  }
  @objc private func pressUp() {
    UIView.animate(withDuration: 0.12) { self.alpha = 1; self.transform = .identity }
  }
}

// ─────────────────────────────────────────────────────────────
// MARK: - Vista principal
// ─────────────────────────────────────────────────────────────

@objc(EGChatKeyboardView)
final class EGChatKeyboardView: UIView {

  @objc var text: NSString = "" { didSet { currentText = text as String } }
  @objc var onChangeText: RCTBubblingEventBlock?
  @objc var onSubmit: RCTBubblingEventBlock?

  private var currentText = ""
  private var isNumbers   = false
  private var isUppercase = false
  private var currentLang: Lang = .es
  private var showEmojis  = false
  private var currentEmojiCat = 0

  private let mainStack  = UIStackView()
  private let emojiPanel = UIView()
  private let feedback   = UIImpactFeedbackGenerator(style: .light)
  private var accentPopup: UIView?

  // Paleta moderna oscura/clara adaptada
  private let C = KeyboardColors()

  override init(frame: CGRect) { super.init(frame: frame); build() }
  required init?(coder: NSCoder) { super.init(coder: coder); build() }

  private func build() {
    backgroundColor = C.bg
    feedback.prepare()
    setupMainStack()
    setupEmojiPanel()
    showKeyboardView()
  }

  // ─────────────────────────────────────────────────────────
  // MARK: Stack principal
  // ─────────────────────────────────────────────────────────

  private func setupMainStack() {
    mainStack.axis = .vertical
    mainStack.spacing = 7
    mainStack.distribution = .fillEqually
    mainStack.translatesAutoresizingMaskIntoConstraints = false
    addSubview(mainStack)
    NSLayoutConstraint.activate([
      mainStack.leadingAnchor.constraint(equalTo: leadingAnchor, constant: 4),
      mainStack.trailingAnchor.constraint(equalTo: trailingAnchor, constant: -4),
      mainStack.topAnchor.constraint(equalTo: topAnchor, constant: 8),
      mainStack.bottomAnchor.constraint(equalTo: safeAreaLayoutGuide.bottomAnchor, constant: -5),
    ])
  }

  private func renderKeys() {
    mainStack.arrangedSubviews.forEach { $0.removeFromSuperview() }
    let rows = isNumbers ? numberRows : (letterRows[currentLang] ?? letterRows[.es]!)
    for keys in rows {
      let row = UIStackView()
      row.axis = .horizontal
      row.spacing = 5
      row.distribution = .fillProportionally
      for key in keys { row.addArrangedSubview(makeKey(key)) }
      mainStack.addArrangedSubview(row)
    }
    if !isNumbers { insertLangRow() }
  }

  private func insertLangRow() {
    let row = UIStackView()
    row.axis = .horizontal
    row.spacing = 5
    row.distribution = .fillEqually

    for lang in Lang.allCases {
      let active = lang == currentLang
      let btn = KeyButton(
        title: lang.rawValue,
        fontSize: 12,
        weight: .bold,
        textColor: active ? .white : C.keyText,
        bgColor: active ? C.accent : C.specialKey,
        radius: 8
      )
      btn.translatesAutoresizingMaskIntoConstraints = false
      btn.heightAnchor.constraint(equalToConstant: 30).isActive = true
      let l = lang
      btn.onTap = { [weak self] in
        self?.currentLang = l
        self?.renderKeys()
      }
      row.addArrangedSubview(btn)
    }
    mainStack.insertArrangedSubview(row, at: 0)
  }

  // ─────────────────────────────────────────────────────────
  // MARK: Crear tecla
  // ─────────────────────────────────────────────────────────

  private func makeKey(_ key: String) -> KeyButton {
    let isSpecial = specialKey(key)
    let isSend    = key == "↵"
    let isShift   = key == "⇧"

    let fontSize: CGFloat = key.count == 1 ? 19 : 15
    let weight: UIFont.Weight = isSpecial ? .semibold : .regular

    let bg = isSend    ? C.accent
           : isSpecial ? C.specialKey
           : C.normalKey

    let fg = isSend ? UIColor.white : C.keyText

    let btn = KeyButton(title: displayTitle(for: key),
                        fontSize: isShift ? 17 : fontSize,
                        weight: weight,
                        textColor: fg,
                        bgColor: bg,
                        radius: 10)

    btn.translatesAutoresizingMaskIntoConstraints = false
    let w = keyWidth(for: key)
    if w > 0 { btn.widthAnchor.constraint(equalToConstant: w).isActive = true }
    btn.accessibilityIdentifier = key

    btn.onTap = { [weak self] in self?.handle(key) }

    // Press largo para acentos
    if accentMap[key.lowercased()] != nil {
      btn.onLongPress = { [weak self] in
        guard let self else { return }
        let base = self.isUppercase ? key.uppercased() : key
        let vars = accentMap[key.lowercased()]!.map { self.isUppercase ? $0.uppercased() : $0 }
        self.feedback.impactOccurred(intensity: 0.6)
        self.showAccentPopup(variants: [base] + vars, sourceView: btn)
      }
    }

    return btn
  }

  private func displayTitle(for key: String) -> String {
    switch key {
    case "⇧":     return isUppercase ? "⬆︎" : "⇧"
    case "espacio": return "espacio"
    case "↵":      return "↵"
    case "😊":     return "😊"
    default:
      return (key.count == 1 && !isNumbers && isUppercase) ? key.uppercased() : key
    }
  }

  private func specialKey(_ key: String) -> Bool {
    ["123","ABC","⌫","⇧","↵","😊","espacio"].contains(key)
  }

  private func keyWidth(for key: String) -> CGFloat {
    switch key {
    case "espacio": return 200
    case "↵":       return 88
    case "123","ABC": return 76
    case "⇧","⌫":   return 56
    case "😊":       return 46
    default:         return 0
    }
  }

  // ─────────────────────────────────────────────────────────
  // MARK: Manejo de teclas
  // ─────────────────────────────────────────────────────────

  private func handle(_ key: String) {
    feedback.impactOccurred(intensity: 0.35)
    feedback.prepare()
    dismissAccentPopup()

    switch key {
    case "123":   isNumbers = true;  renderKeys()
    case "ABC":   isNumbers = false; renderKeys()
    case "⇧":    isUppercase.toggle(); renderKeys()
    case "⌫":
      if !currentText.isEmpty { currentText.removeLast(); emitChange() }
    case "espacio": currentText.append(" "); emitChange()
    case "↵":      onSubmit?([:])
    case "😊":     showEmojis = true; showEmojiView()
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

  private func showAccentPopup(variants: [String], sourceView: UIView) {
    dismissAccentPopup()
    let btnW: CGFloat = 38, btnH: CGFloat = 46, pad: CGFloat = 6
    let totalW = CGFloat(variants.count) * (btnW + pad) + pad

    let popup = UIView()
    popup.backgroundColor = UIColor(red: 0.18, green: 0.18, blue: 0.20, alpha: 0.96)
    popup.layer.cornerRadius = 12
    popup.layer.shadowColor = UIColor.black.cgColor
    popup.layer.shadowOpacity = 0.3
    popup.layer.shadowRadius = 8
    popup.translatesAutoresizingMaskIntoConstraints = false

    let stack = UIStackView()
    stack.axis = .horizontal
    stack.spacing = pad
    stack.translatesAutoresizingMaskIntoConstraints = false
    popup.addSubview(stack)

    for v in variants {
      let b = KeyButton(title: v, fontSize: 21, weight: .medium,
                        textColor: .white, bgColor: .clear, radius: 8)
      b.widthAnchor.constraint(equalToConstant: btnW).isActive = true
      b.heightAnchor.constraint(equalToConstant: btnH).isActive = true
      let char = v
      b.onTap = { [weak self] in
        self?.currentText.append(char)
        self?.emitChange()
        self?.dismissAccentPopup()
        if self?.isUppercase == true { self?.isUppercase = false; self?.renderKeys() }
      }
      stack.addArrangedSubview(b)
    }

    NSLayoutConstraint.activate([
      stack.leadingAnchor.constraint(equalTo: popup.leadingAnchor, constant: pad),
      stack.trailingAnchor.constraint(equalTo: popup.trailingAnchor, constant: -pad),
      stack.topAnchor.constraint(equalTo: popup.topAnchor, constant: 4),
      stack.bottomAnchor.constraint(equalTo: popup.bottomAnchor, constant: -4),
    ])

    addSubview(popup)
    let src = sourceView.convert(sourceView.bounds, to: self)
    var xPos = src.midX - totalW / 2
    xPos = max(4, min(xPos, bounds.width - totalW - 4))
    NSLayoutConstraint.activate([
      popup.leadingAnchor.constraint(equalTo: leadingAnchor, constant: xPos),
      popup.topAnchor.constraint(equalTo: topAnchor, constant: max(4, src.minY - btnH - 12)),
      popup.widthAnchor.constraint(equalToConstant: totalW),
    ])
    popup.alpha = 0
    UIView.animate(withDuration: 0.14) { popup.alpha = 1 }
    accentPopup = popup
  }

  private func dismissAccentPopup() {
    accentPopup?.removeFromSuperview(); accentPopup = nil
  }

  override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
    super.touchesBegan(touches, with: event)
    guard accentPopup != nil,
          let t = touches.first,
          accentPopup?.bounds.contains(t.location(in: accentPopup)) == false
    else { return }
    dismissAccentPopup()
  }

  // ─────────────────────────────────────────────────────────
  // MARK: Panel de emojis
  // ─────────────────────────────────────────────────────────

  private func setupEmojiPanel() {
    emojiPanel.backgroundColor = C.bg
    emojiPanel.translatesAutoresizingMaskIntoConstraints = false
    addSubview(emojiPanel)
    NSLayoutConstraint.activate([
      emojiPanel.leadingAnchor.constraint(equalTo: leadingAnchor),
      emojiPanel.trailingAnchor.constraint(equalTo: trailingAnchor),
      emojiPanel.topAnchor.constraint(equalTo: topAnchor),
      emojiPanel.bottomAnchor.constraint(equalTo: bottomAnchor),
    ])
    emojiPanel.isHidden = true
  }

  private func buildEmojiPanel() {
    emojiPanel.subviews.forEach { $0.removeFromSuperview() }

    // Barra de categorías
    let catBar = UIScrollView()
    catBar.showsHorizontalScrollIndicator = false
    catBar.translatesAutoresizingMaskIntoConstraints = false
    emojiPanel.addSubview(catBar)

    let catStack = UIStackView()
    catStack.axis = .horizontal
    catStack.spacing = 4
    catStack.translatesAutoresizingMaskIntoConstraints = false
    catBar.addSubview(catStack)

    for (i, (icon, _)) in emojiCategories.enumerated() {
      let b = KeyButton(title: icon, fontSize: 22, weight: .regular,
                        textColor: .label,
                        bgColor: i == currentEmojiCat
                          ? C.accent.withAlphaComponent(0.25)
                          : .clear,
                        radius: 8)
      b.widthAnchor.constraint(equalToConstant: 42).isActive = true
      b.heightAnchor.constraint(equalToConstant: 38).isActive = true
      let idx = i
      b.onTap = { [weak self] in self?.currentEmojiCat = idx; self?.buildEmojiPanel() }
      catStack.addArrangedSubview(b)
    }

    // Botón volver al teclado
    let backBtn = KeyButton(title: "⌨️", fontSize: 20, weight: .regular,
                            textColor: .label, bgColor: C.specialKey, radius: 8)
    backBtn.widthAnchor.constraint(equalToConstant: 42).isActive = true
    backBtn.heightAnchor.constraint(equalToConstant: 38).isActive = true
    backBtn.onTap = { [weak self] in self?.showEmojis = false; self?.showKeyboardView() }
    catStack.addArrangedSubview(backBtn)

    NSLayoutConstraint.activate([
      catBar.leadingAnchor.constraint(equalTo: emojiPanel.leadingAnchor, constant: 4),
      catBar.trailingAnchor.constraint(equalTo: emojiPanel.trailingAnchor, constant: -4),
      catBar.topAnchor.constraint(equalTo: emojiPanel.topAnchor, constant: 6),
      catBar.heightAnchor.constraint(equalToConstant: 44),
      catStack.leadingAnchor.constraint(equalTo: catBar.leadingAnchor),
      catStack.trailingAnchor.constraint(equalTo: catBar.trailingAnchor),
      catStack.topAnchor.constraint(equalTo: catBar.topAnchor),
      catStack.bottomAnchor.constraint(equalTo: catBar.bottomAnchor),
      catStack.heightAnchor.constraint(equalTo: catBar.heightAnchor),
    ])

    // Grid de emojis
    let emojis = emojiCategories[currentEmojiCat].1
    let scroll = UIScrollView()
    scroll.showsVerticalScrollIndicator = false
    scroll.translatesAutoresizingMaskIntoConstraints = false
    emojiPanel.addSubview(scroll)
    NSLayoutConstraint.activate([
      scroll.leadingAnchor.constraint(equalTo: emojiPanel.leadingAnchor, constant: 6),
      scroll.trailingAnchor.constraint(equalTo: emojiPanel.trailingAnchor, constant: -6),
      scroll.topAnchor.constraint(equalTo: catBar.bottomAnchor, constant: 4),
      scroll.bottomAnchor.constraint(equalTo: emojiPanel.safeAreaLayoutGuide.bottomAnchor, constant: -4),
    ])

    let cols = 8
    let cellSize: CGFloat = (UIScreen.main.bounds.width - 12) / CGFloat(cols)
    let rows = Int(ceil(Double(emojis.count) / Double(cols)))
    let gridH = CGFloat(rows) * cellSize

    let grid = UIView()
    grid.translatesAutoresizingMaskIntoConstraints = false
    scroll.addSubview(grid)
    NSLayoutConstraint.activate([
      grid.leadingAnchor.constraint(equalTo: scroll.leadingAnchor),
      grid.trailingAnchor.constraint(equalTo: scroll.trailingAnchor),
      grid.topAnchor.constraint(equalTo: scroll.topAnchor),
      grid.bottomAnchor.constraint(equalTo: scroll.bottomAnchor),
      grid.widthAnchor.constraint(equalTo: scroll.widthAnchor),
      grid.heightAnchor.constraint(equalToConstant: gridH),
    ])

    for (i, emoji) in emojis.enumerated() {
      let col = i % cols
      let row = i / cols
      let b = KeyButton(title: emoji, fontSize: 27, weight: .regular,
                        textColor: .label, bgColor: .clear, radius: 8)
      b.frame = CGRect(x: CGFloat(col)*cellSize, y: CGFloat(row)*cellSize,
                       width: cellSize, height: cellSize)
      let e = emoji
      b.onTap = { [weak self] in
        self?.feedback.impactOccurred(intensity: 0.28)
        self?.currentText.append(e)
        self?.emitChange()
      }
      grid.addSubview(b)
    }
  }

  // ─────────────────────────────────────────────────────────
  // MARK: Mostrar / ocultar paneles
  // ─────────────────────────────────────────────────────────

  private func showKeyboardView() {
    emojiPanel.isHidden = true
    mainStack.isHidden = false
    renderKeys()
  }

  private func showEmojiView() {
    mainStack.isHidden = true
    emojiPanel.isHidden = false
    buildEmojiPanel()
  }
}

// ─────────────────────────────────────────────────────────────
// MARK: - Paleta de colores adaptativa
// ─────────────────────────────────────────────────────────────

private struct KeyboardColors {
  /// Fondo del teclado
  var bg: UIColor {
    UIColor { t in
      t.userInterfaceStyle == .dark
        ? UIColor(red: 0.14, green: 0.14, blue: 0.16, alpha: 1)
        : UIColor(red: 0.82, green: 0.84, blue: 0.88, alpha: 1)
    }
  }
  /// Tecla normal
  var normalKey: UIColor {
    UIColor { t in
      t.userInterfaceStyle == .dark
        ? UIColor(red: 0.28, green: 0.28, blue: 0.31, alpha: 1)
        : UIColor.white
    }
  }
  /// Tecla especial (shift, delete, 123…)
  var specialKey: UIColor {
    UIColor { t in
      t.userInterfaceStyle == .dark
        ? UIColor(red: 0.20, green: 0.20, blue: 0.23, alpha: 1)
        : UIColor(red: 0.68, green: 0.71, blue: 0.76, alpha: 1)
    }
  }
  /// Texto de teclas
  var keyText: UIColor { UIColor.label }
  /// Color de acento (idioma activo, tecla intro)
  var accent: UIColor { UIColor(red: 0.0, green: 0.70, blue: 0.63, alpha: 1) }
}
