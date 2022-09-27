import xml.etree.ElementTree as ET

from server.utils import (
    load_xml
)

class Topology:
    def __init__(self, file_path: str, profile_format: str):
        """
        Initializes a Timeline object.
        """
        self.xml_tree, self.topo = self.init(file_path, profile_format)

    def init(self, file_path: str, profile_format: str):
        """
        Init to calculate the base data structures for the topology.
        """
        if profile_format == "lstopo":
            xml_str = load_xml(file_path)
            xml_tree = ET.fromstring(xml_str)
            topo = self.from_xml(self.xml_tree)
            return xml_tree, topo 

    def parse_xml(self, node):
        """
        convert xml to python object
        node: xml.etree.ElementTree object
        """

        name = node.tag

        pytype = type(name, (object, ), {})
        pyobj = pytype()

        for attr in node.attrib.keys():
            setattr(pyobj, attr, node.get(attr))

        if node.text and node.text != '' and node.text != ' ' and node.text != '\n':
            setattr(pyobj, 'text', node.text)

        for cn in node:
            if not hasattr(pyobj, cn.tag):
                setattr(pyobj, cn.tag, [])
            getattr(pyobj, cn.tag).append(self.parse_xml(cn))

        return pyobj