// Stub de @expo/vector-icons para web
// Reemplaza los iconos de fuente TTF (1-2MB) con texto Unicode
const React = require('react');
const { Text } = require('react-native');

const createIconSet = () => {
  const Icon = ({ name, size = 24, color = '#000', style }) =>
    React.createElement(Text, { style: [{ fontSize: size, color, lineHeight: size + 4 }, style] }, '●');
  Icon.Button = Icon;
  return Icon;
};

const Ionicons = createIconSet();
const MaterialIcons = createIconSet();
const MaterialCommunityIcons = createIconSet();
const FontAwesome = createIconSet();
const FontAwesome5 = createIconSet();
const FontAwesome6 = createIconSet();
const Feather = createIconSet();
const AntDesign = createIconSet();
const Entypo = createIconSet();
const EvilIcons = createIconSet();
const Foundation = createIconSet();
const Octicons = createIconSet();
const Zocial = createIconSet();
const SimpleLineIcons = createIconSet();
const Fontisto = createIconSet();

module.exports = {
  Ionicons, MaterialIcons, MaterialCommunityIcons,
  FontAwesome, FontAwesome5, FontAwesome6,
  Feather, AntDesign, Entypo, EvilIcons,
  Foundation, Octicons, Zocial, SimpleLineIcons, Fontisto,
  createIconSet,
};
