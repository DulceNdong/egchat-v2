import UIKit
import React

// ─────────────────────────────────────────────────────────────
// MARK: - Manager (bridge React Native)
// ─────────────────────────────────────────────────────────────

@objc(EGChatKeyboardViewManager)
final class EGChatKeyboardViewManager: RCTViewManager {
  override func view() -> UIView! { EGChatKeyboardView() }
  override static func requiresMainQueueSetup() -> Bool { true }
}

// ─────────────────────────────────────────────────────────────
// MARK: - Datos de idiomas y emojis
// ─────────────────────────────────────────────────────────────

private enum Lang: String, CaseIterable {
  case es = "ES", en = "EN", fr = "FR"
}

private let letterRows: [Lang: [[String]]] = [
  .es: [
    ["q","w","e","r","t","y","u","i","o","p"],
    ["a","s","d","f","g","h","j","k","l","ñ"],
    ["⇧","z","x","c","v","b","n","m","⌫"],
    ["123","😊","espacio","intro"],
  ],
  .en: [
    ["q","w","e","r","t","y","u","i","o","p"],
    ["a","s","d","f","g","h","j","k","l"],
    ["⇧","z","x","c","v","b","n","m","⌫"],
    ["123","😊","espacio","intro"],
  ],
  .fr: [
    ["a","z","e","r","t","y","u","i","o","p"],
    ["q","s","d","f","g","h","j","k","l","m"],
    ["⇧","w","x","c","v","b","n","⌫"],
    ["123","😊","espacio","intro"],
  ],
]

private let numberRows: [[String]] = [
  ["1","2","3","4","5","6","7","8","9","0"],
  ["-","/",":",";","(",")","\u{20AC}","&","@","\""],
  ["ABC",".",",","?","!","'","⌫"],
  ["ABC","😊","espacio","intro"],
]

// Acentos / variantes por tecla
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

// Emojis organizados por categoría
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
          "✍️","💅","🤳","💪","🦾","🦿","🦵","🦶","👂","🦻",
          "👃","🫀","🫁","🧠","🦷","🦴","👀","👁","👅","👄"]),
  ("❤️", ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔",
          "❣️","💕","💞","💓","💗","💖","💘","💝","💟","☮️",
          "✝️","☯️","🕊","🌈","🌟","⭐","💫","✨","🎉","🎊",
          "🎈","🎁","🎂","🎀","🏆","🥇","🎖","🏅","🥈","🥉"]),
  ("🐶", ["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯",
          "🦁","🐮","🐷","🐸","🐵","🙈","🙉","🙊","🐔","🐧",
          "🐦","🐤","🦆","🦅","🦉","🦇","🐺","🐗","🐴","🦄",
          "🐝","🐛","🦋","🐌","🐞","🐜","🦟","🦗","🦂","🐢"]),
  ("🍎", ["🍎","🍊","🍋","🍇","🍓","🍒","🍑","🥭","🍍","🥥",
          "🥝","🍅","🍆","🥑","🥦","🥬","🥒","🌽","🥕","🧅",
          "🍔","🍕","🌮","🌯","🥗","🍜","🍝","🍛","🍣","🍱",
          "🍦","🍩","🎂","🍫","🍬","🍭","☕","🧃","🥤","🍺"]),
  ("⚽", ["⚽","🏀","🏈","⚾","🥎","🏐","🏉","🎾","🎱","🏓",
          "🏸","🥊","🥋","⛳","🎯","🎳","🏹","🎣","🤿","🎽",
          "🛹","🛷","🥌","🏋️","🤸","⛹️","🤺","🤼","🤾","🤽",
          "🚴","🏊","🧘","🏄","🚵","🏇","🤼","🎮","🕹","🎲"]),
  ("🚗", ["🚗","🚕","🚙","🚌","🚎","🏎","🚓","🚑","🚒","🚐",
          "🛻","🚚","🚛","🚜","🏍","🛵","🚲","🛴","🛺","🚁",
          "✈️","🚀","🛸","🚂","🚢","⛵","🛥","🛶","🚤","⛴",
          "🗺","🏔","🌋","🏕","🏖","🏜","🏝","🏞","🏙","🌃"]),
  ("💡", ["💡","🔦","🕯","🔌","🔋","💻","🖥","🖨","⌨️","🖱",
          "📱","☎️","📞","📟","📠","📺","📷","📸","📹","📼",
          "🔭","🔬","🧬","🧪","🧫","🧲","🔧","🔨","⚙️","🔩",
          "🪛","🔑","🗝","🔐","🔒","🔓","🚪","📦","📬","📮"]),
]

// ─────────────────────────────────────────────────────────────
// MARK: - Vista principal
// ─────────────────────────────────────────────────────────────

@objc(EGChatKeyboardView)
final class EGChatKeyboardView: UIView {

  // Props React Native
  @objc var text: NSString = "" { didSet { currentText = text as String } }
  @objc var onChangeText: RCTBubblingEventBlock?
  @objc var onSubmit: RCTBubblingEventBlock?

  // Estado interno
  private var currentText = ""
  private var isNumbers = false
  private var isUppercase = false
  private var currentLang: Lang = .es
  private var showEmojis = false
  private var currentEmojiCat = 0

  // UI
  private let mainStack   = UIStackView()   // teclado letras/números
  private let emojiPanel  = UIView()        // panel emojis
  private let feedback    = UIImpactFeedbackGenerator(style: .light)

  // Press-largo para acentos
  private var accentPopup: UIView?
  private var longPressKey: String?

  // Colores
  private let bgColor      = UIColor(red: 0.82, green: 0.84, blue: 0.88, alpha: 1)
  private let keyColor     = UIColor.white
  private let specialColor = UIColor(red: 0.69, green: 0.72, blue: 0.77, alpha: 1)
  private let keyText      = UIColor(red: 0.10, green: 0.10, blue: 0.10, alpha: 1)

  // ── init ──────────────────────────────────────────────────

  override init(frame: CGRect) { super.init(frame: frame); setup() }
  required init?(coder: NSCoder) { super.init(coder: coder); setup() }

  private func setup() {
    backgroundColor = bgColor
    feedback.prepare()
    setupMainStack()
    setupEmojiPanel()
    showEmojis ? showEmojiView() : showKeyboardView()
  }

  // ─────────────────────────────────────────────────────────
  // MARK: - Teclado principal
  // ─────────────────────────────────────────────────────────

  private func setupMainStack() {
    mainStack.axis = .vertical
    mainStack.spacing = 8
    mainStack.distribution = .fillEqually
    mainStack.translatesAutoresizingMaskIntoConstraints = false
    addSubview(mainStack)
    NSLayoutConstraint.activate([
      mainStack.leadingAnchor.constraint(equalTo: leadingAnchor, constant: 5),
      mainStack.trailingAnchor.constraint(equalTo: trailingAnchor, constant: -5),
      mainStack.topAnchor.constraint(equalTo: topAnchor, constant: 8),
      mainStack.bottomAnchor.constraint(equalTo: safeAreaLayoutGuide.bottomAnchor, constant: -6),
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
    // Fila de idiomas encima (solo en modo letras)
    if !isNumbers { insertLangRow() }
  }

  private func insertLangRow() {
    let row = UIStackView()
    row.axis = .horizontal
    row.spacing = 5
    row.distribution = .fillEqually

    for lang in Lang.allCases {
      let btn = UIButton(type: .system)
      btn.setTitle(lang.rawValue, for: .normal)
      btn.titleLabel?.font = UIFont.systemFont(ofSize: 12, weight: .semibold)
      let active = lang == currentLang
      btn.setTitleColor(active ? .white : keyText, for: .normal)
      btn.backgroundColor = active
        ? UIColor(red: 0.0, green: 0.70, blue: 0.63, alpha: 1)
        : specialColor
      btn.layer.cornerRadius = 6
      btn.translatesAutoresizingMaskIntoConstraints = false
      btn.heightAnchor.constraint(equalToConstant: 28).isActive = true
      btn.addAction(UIAction { [weak self] _ in
        self?.currentLang = lang
        self?.renderKeys()
      }, for: .touchUpInside)
      row.addArrangedSubview(btn)
    }
    // Insertar como primera fila
    mainStack.insertArrangedSubview(row, at: 0)
  }

  // ─────────────────────────────────────────────────────────
  // MARK: - Crear tecla
  // ─────────────────────────────────────────────────────────

  private func makeKey(_ key: String) -> UIButton {
    let btn = UIButton(type: .system)
    btn.setTitle(displayTitle(for: key), for: .normal)

    let isSpecial = specialKey(key)
    let fontSize: CGFloat = key.count == 1 ? 20 : 15
    btn.titleLabel?.font = UIFont.systemFont(ofSize: fontSize, weight: isSpecial ? .medium : .regular)
    btn.setTitleColor(keyText, for: .normal)
    btn.backgroundColor = isSpecial ? specialColor : keyColor
    btn.layer.cornerRadius = 7
    // Sin sombra debajo — solo borde sutil
    btn.layer.borderWidth = 0
    btn.layer.shadowOpacity = 0

    btn.translatesAutoresizingMaskIntoConstraints = false
    let w = keyWidth(for: key)
    if w > 0 { btn.widthAnchor.constraint(equalToConstant: w).isActive = true }

    // Acción normal
    btn.addAction(UIAction { [weak self] _ in self?.handle(key) }, for: .touchUpInside)

    // Press largo → popup acentos
    if accentMap[key.lowercased()] != nil || accentMap[key] != nil {
      let lp = UILongPressGestureRecognizer(target: self, action: #selector(handleLongPress(_:)))
      lp.minimumPressDuration = 0.35
      btn.addGestureRecognizer(lp)
      btn.accessibilityIdentifier = key
    }

    return btn
  }

  private func displayTitle(for key: String) -> String {
    switch key {
    case "⇧": return isUppercase ? "⬆︎" : "⇧"
    case "espacio": return "espacio"
    case "intro": return "↵"
    case "😊": return "😊"
    default:
      if key.count == 1 && !isNumbers {
        return isUppercase ? key.uppercased() : key
      }
      return key
    }
  }

  private func specialKey(_ key: String) -> Bool {
    ["123","ABC","⌫","⇧","intro","😊","espacio"].contains(key)
  }

  private func keyWidth(for key: String) -> CGFloat {
    switch key {
    case "espacio": return 200
    case "intro":   return 90
    case "123","ABC": return 78
    case "⇧","⌫":  return 58
    case "😊":      return 48
    default:        return 0   // fillProportionally
    }
  }

  // ─────────────────────────────────────────────────────────
  // MARK: - Manejo de teclas
  // ─────────────────────────────────────────────────────────

  private func handle(_ key: String) {
    feedback.impactOccurred(intensity: 0.4)
    feedback.prepare()
    dismissAccentPopup()

    switch key {
    case "123":
      isNumbers = true; renderKeys()
    case "ABC":
      isNumbers = false; renderKeys()
    case "⇧":
      isUppercase.toggle(); renderKeys()
    case "⌫":
      if !currentText.isEmpty { currentText.removeLast(); emitChange() }
    case "espacio":
      currentText.append(" "); emitChange()
    case "intro":
      onSubmit?([:])
    case "😊":
      showEmojis = true; showEmojiView()
    default:
      let ch = (isUppercase && !isNumbers) ? key.uppercased() : key
      currentText.append(ch)
      if isUppercase && !isNumbers { isUppercase = false; renderKeys() }
      emitChange()
    }
  }

  private func emitChange() {
    onChangeText?(["text": currentText])
  }

  // ─────────────────────────────────────────────────────────
  // MARK: - Press largo → popup acentos
  // ─────────────────────────────────────────────────────────

  @objc private func handleLongPress(_ gr: UILongPressGestureRecognizer) {
    guard gr.state == .began,
          let btn = gr.view as? UIButton,
          let key = btn.accessibilityIdentifier else { return }

    let base = isUppercase ? key.uppercased() : key
    let variants = accentMap[key.lowercased()]?.map { isUppercase ? $0.uppercased() : $0 } ?? []
    guard !variants.isEmpty else { return }

    feedback.impactOccurred(intensity: 0.6)
    showAccentPopup(variants: [base] + variants, sourceView: btn)
  }

  private func showAccentPopup(variants: [String], sourceView: UIView) {
    dismissAccentPopup()

    let btnW: CGFloat = 36
    let btnH: CGFloat = 44
    let padding: CGFloat = 6
    let totalW = CGFloat(variants.count) * (btnW + padding) + padding

    let popup = UIView()
    popup.backgroundColor = UIColor(red: 0.22, green: 0.22, blue: 0.24, alpha: 0.97)
    popup.layer.cornerRadius = 10
    popup.translatesAutoresizingMaskIntoConstraints = false

    let stack = UIStackView()
    stack.axis = .horizontal
    stack.spacing = padding
    stack.translatesAutoresizingMaskIntoConstraints = false
    popup.addSubview(stack)

    for v in variants {
      let b = UIButton(type: .system)
      b.setTitle(v, for: .normal)
      b.titleLabel?.font = UIFont.systemFont(ofSize: 20, weight: .medium)
      b.setTitleColor(.white, for: .normal)
      b.backgroundColor = .clear
      b.widthAnchor.constraint(equalToConstant: btnW).isActive = true
      b.heightAnchor.constraint(equalToConstant: btnH).isActive = true
      b.layer.cornerRadius = 7
      let char = v
      b.addAction(UIAction { [weak self] _ in
        self?.currentText.append(char)
        self?.emitChange()
        self?.dismissAccentPopup()
        if self?.isUppercase == true { self?.isUppercase = false; self?.renderKeys() }
      }, for: .touchUpInside)
      stack.addArrangedSubview(b)
    }

    NSLayoutConstraint.activate([
      stack.leadingAnchor.constraint(equalTo: popup.leadingAnchor, constant: padding),
      stack.trailingAnchor.constraint(equalTo: popup.trailingAnchor, constant: -padding),
      stack.topAnchor.constraint(equalTo: popup.topAnchor, constant: 4),
      stack.bottomAnchor.constraint(equalTo: popup.bottomAnchor, constant: -4),
    ])

    addSubview(popup)

    let srcFrame = sourceView.convert(sourceView.bounds, to: self)
    var xPos = srcFrame.midX - totalW / 2
    xPos = max(4, min(xPos, bounds.width - totalW - 4))
    let yPos = srcFrame.minY - btnH - 14

    NSLayoutConstraint.activate([
      popup.leadingAnchor.constraint(equalTo: leadingAnchor, constant: xPos),
      popup.topAnchor.constraint(equalTo: topAnchor, constant: max(4, yPos)),
      popup.widthAnchor.constraint(equalToConstant: totalW),
    ])

    popup.alpha = 0
    UIView.animate(withDuration: 0.15) { popup.alpha = 1 }
    accentPopup = popup
  }

  private func dismissAccentPopup() {
    accentPopup?.removeFromSuperview()
    accentPopup = nil
  }

  // ─────────────────────────────────────────────────────────
  // MARK: - Panel de emojis
  // ─────────────────────────────────────────────────────────

  private func setupEmojiPanel() {
    emojiPanel.backgroundColor = bgColor
    emojiPanel.translatesAutoresizingMaskIntoConstraints = false
    addSubview(emojiPanel)
    NSLayoutConstraint.activate([
      emojiPanel.leadingAnchor.constraint(equalTo: leadingAnchor),
      emojiPanel.trailingAnchor.constraint(equalTo: trailingAnchor),
      emojiPanel.topAnchor.constraint(equalTo: topAnchor),
      emojiPanel.bottomAnchor.constraint(equalTo: bottomAnchor),
    ])
    emojiPanel.isHidden = true
    buildEmojiPanel()
  }

  private func buildEmojiPanel() {
    emojiPanel.subviews.forEach { $0.removeFromSuperview() }

    // Barra superior: categorías + botón volver
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
      let b = UIButton(type: .system)
      b.setTitle(icon, for: .normal)
      b.titleLabel?.font = UIFont.systemFont(ofSize: 22)
      b.widthAnchor.constraint(equalToConstant: 40).isActive = true
      b.heightAnchor.constraint(equalToConstant: 36).isActive = true
      b.backgroundColor = i == currentEmojiCat
        ? UIColor(red: 0.0, green: 0.70, blue: 0.63, alpha: 0.25)
        : .clear
      b.layer.cornerRadius = 8
      let idx = i
      b.addAction(UIAction { [weak self] _ in
        self?.currentEmojiCat = idx
        self?.buildEmojiPanel()
      }, for: .touchUpInside)
      catStack.addArrangedSubview(b)
    }

    // Botón volver al teclado
    let backBtn = UIButton(type: .system)
    backBtn.setTitle("⌨️", for: .normal)
    backBtn.titleLabel?.font = UIFont.systemFont(ofSize: 22)
    backBtn.widthAnchor.constraint(equalToConstant: 40).isActive = true
    backBtn.heightAnchor.constraint(equalToConstant: 36).isActive = true
    backBtn.addAction(UIAction { [weak self] _ in
      self?.showEmojis = false
      self?.showKeyboardView()
    }, for: .touchUpInside)
    catStack.addArrangedSubview(backBtn)

    NSLayoutConstraint.activate([
      catBar.leadingAnchor.constraint(equalTo: emojiPanel.leadingAnchor, constant: 4),
      catBar.trailingAnchor.constraint(equalTo: emojiPanel.trailingAnchor, constant: -4),
      catBar.topAnchor.constraint(equalTo: emojiPanel.topAnchor, constant: 6),
      catBar.heightAnchor.constraint(equalToConstant: 40),
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
      scroll.bottomAnchor.constraint(equalTo: emojiPanel.safeAreaLayoutGuide.bottomAnchor, constant: -6),
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
      let btn = UIButton(type: .system)
      btn.setTitle(emoji, for: .normal)
      btn.titleLabel?.font = UIFont.systemFont(ofSize: 28)
      btn.frame = CGRect(
        x: CGFloat(col) * cellSize,
        y: CGFloat(row) * cellSize,
        width: cellSize,
        height: cellSize
      )
      let e = emoji
      btn.addAction(UIAction { [weak self] _ in
        self?.feedback.impactOccurred(intensity: 0.3)
        self?.currentText.append(e)
        self?.emitChange()
      }, for: .touchUpInside)
      grid.addSubview(btn)
    }
  }

  // ─────────────────────────────────────────────────────────
  // MARK: - Mostrar / ocultar paneles
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

  // Tocar fuera del popup lo cierra
  override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
    super.touchesBegan(touches, with: event)
    if accentPopup != nil {
      if let touch = touches.first, accentPopup?.bounds.contains(touch.location(in: accentPopup)) == false {
        dismissAccentPopup()
      }
    }
  }
}
