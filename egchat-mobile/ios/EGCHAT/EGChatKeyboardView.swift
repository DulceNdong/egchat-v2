import UIKit
import React

@objc(EGChatKeyboardViewManager)
final class EGChatKeyboardViewManager: RCTViewManager {
  override func view() -> UIView! {
    EGChatKeyboardView()
  }

  override static func requiresMainQueueSetup() -> Bool {
    true
  }
}

@objc(EGChatKeyboardView)
final class EGChatKeyboardView: UIView {
  @objc var text: NSString = "" {
    didSet {
      currentText = text as String
    }
  }

  @objc var onChangeText: RCTBubblingEventBlock?
  @objc var onSubmit: RCTBubblingEventBlock?

  private var currentText = ""
  private var isNumbers = false
  private var isUppercase = false
  private let stack = UIStackView()
  private let feedback = UIImpactFeedbackGenerator(style: .light)

  private let lettersRows = [
    ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
    ["a", "s", "d", "f", "g", "h", "j", "k", "l", "ñ"],
    ["⇧", "z", "x", "c", "v", "b", "n", "m", "⌫"],
    ["123", "espacio", "intro"],
  ]

  private let numberRows = [
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
    ["-", "/", ":", ";", "(", ")", "€", "&", "@", "\""],
    ["ABC", ".", ",", "?", "!", "'", "⌫"],
    ["ABC", "espacio", "intro"],
  ]

  override init(frame: CGRect) {
    super.init(frame: frame)
    setup()
  }

  required init?(coder: NSCoder) {
    super.init(coder: coder)
    setup()
  }

  private func setup() {
    backgroundColor = UIColor(red: 0.78, green: 0.80, blue: 0.84, alpha: 1)
    feedback.prepare()

    stack.axis = .vertical
    stack.spacing = 9
    stack.distribution = .fillEqually
    stack.translatesAutoresizingMaskIntoConstraints = false
    addSubview(stack)

    NSLayoutConstraint.activate([
      stack.leadingAnchor.constraint(equalTo: leadingAnchor, constant: 6),
      stack.trailingAnchor.constraint(equalTo: trailingAnchor, constant: -6),
      stack.topAnchor.constraint(equalTo: topAnchor, constant: 8),
      stack.bottomAnchor.constraint(equalTo: safeAreaLayoutGuide.bottomAnchor, constant: -6),
    ])

    renderKeys()
  }

  private func renderKeys() {
    stack.arrangedSubviews.forEach { row in
      stack.removeArrangedSubview(row)
      row.removeFromSuperview()
    }

    let rows = isNumbers ? numberRows : lettersRows
    rows.forEach { keys in
      let row = UIStackView()
      row.axis = .horizontal
      row.spacing = 6
      row.distribution = .fillProportionally

      keys.forEach { key in
        let button = makeButton(for: key)
        row.addArrangedSubview(button)
      }

      stack.addArrangedSubview(row)
    }
  }

  private func makeButton(for key: String) -> UIButton {
    let button = UIButton(type: .system)
    button.setTitle(displayTitle(for: key), for: .normal)
    button.titleLabel?.font = UIFont.systemFont(ofSize: key.count == 1 ? 22 : 17, weight: .regular)
    button.setTitleColor(.black, for: .normal)
    button.backgroundColor = specialKey(key) ? UIColor(red: 0.68, green: 0.72, blue: 0.77, alpha: 1) : .white
    button.layer.cornerRadius = 7
    button.layer.shadowColor = UIColor.black.cgColor
    button.layer.shadowOpacity = 0.18
    button.layer.shadowOffset = CGSize(width: 0, height: 1)
    button.layer.shadowRadius = 0
    button.translatesAutoresizingMaskIntoConstraints = false
    button.widthAnchor.constraint(equalToConstant: width(for: key)).isActive = true
    button.addAction(UIAction { [weak self] _ in self?.handle(key) }, for: .touchUpInside)
    return button
  }

  private func displayTitle(for key: String) -> String {
    if key.count == 1, !isNumbers {
      return isUppercase ? key.uppercased() : key
    }
    return key
  }

  private func specialKey(_ key: String) -> Bool {
    key == "123" || key == "ABC" || key == "⌫" || key == "⇧" || key == "intro"
  }

  private func width(for key: String) -> CGFloat {
    switch key {
    case "espacio": return 220
    case "intro": return 92
    case "123", "ABC": return 82
    case "⇧", "⌫": return 62
    default: return 34
    }
  }

  private func handle(_ key: String) {
    feedback.impactOccurred(intensity: 0.45)
    feedback.prepare()

    switch key {
    case "123":
      isNumbers = true
      renderKeys()
    case "ABC":
      isNumbers = false
      renderKeys()
    case "⇧":
      isUppercase.toggle()
      renderKeys()
    case "⌫":
      if !currentText.isEmpty {
        currentText.removeLast()
        emitChange()
      }
    case "espacio":
      currentText.append(" ")
      emitChange()
    case "intro":
      onSubmit?([:])
    default:
      currentText.append(isUppercase && !isNumbers ? key.uppercased() : key)
      if isUppercase && !isNumbers {
        isUppercase = false
        renderKeys()
      }
      emitChange()
    }
  }

  private func emitChange() {
    onChangeText?(["text": currentText])
  }
}

