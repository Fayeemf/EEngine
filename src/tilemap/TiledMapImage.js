EE.TiledMapImage = function (map, tileset, xmlNode) {
  this.map = map;
  this.xml = xmlNode;
  this.tileset = tileset;

  this.conf = ["format", "id", "source", "trans", "width", "height"];
  this.attrs = parseConfig(this.xml, this.conf);
};