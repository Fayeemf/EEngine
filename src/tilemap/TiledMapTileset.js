EE.TiledMapTileset = function (map, xmlNode) {
  this.map = map;
  this.xml = xmlNode;

  this.conf = ["firstgid", "source", "name", "tilewidth", "tileheight",
    "spacing", "margin", "tilecount", "columns"];
  this.attrs = parseConfig(this.xml, this.conf);
  this.image = new EE.TiledMapImage(this.map, this, this.xml.getElementsByTagName("image")[0]);
};