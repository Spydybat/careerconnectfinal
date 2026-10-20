import java.io.File;
import java.io.StringWriter;
import javax.xml.XMLConstants;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.stream.StreamResult;
import javax.xml.transform.stream.StreamSource;
import javax.xml.validation.Schema;
import javax.xml.validation.SchemaFactory;
import javax.xml.validation.Validator;
import org.xml.sax.SAXException;

public class XmlProcessor {

    public static boolean validateXml(File xmlFile, File xsdFile) {
        System.out.println("--------------------------------------------------");
        System.out.println("Validating: " + xmlFile.getName() + " against " + xsdFile.getName());
        try {
            SchemaFactory factory = SchemaFactory.newInstance(XMLConstants.W3C_XML_SCHEMA_NS_URI);
            Schema schema = factory.newSchema(xsdFile);
            Validator validator = schema.newValidator();
            validator.validate(new StreamSource(xmlFile));
            System.out.println("[SUCCESS] XML document is VALID according to the XSD schema.");
            return true;
        } catch (SAXException e) {
            System.out.println("[FAILED] XML Validation Error: " + e.getMessage());
            return false;
        } catch (Exception e) {
            System.out.println("[ERROR] System Exception: " + e.getMessage());
            return false;
        }
    }

    public static String transformXml(File xmlFile, File xslFile, File outputFile) {
        System.out.println("--------------------------------------------------");
        System.out.println("Transforming: " + xmlFile.getName() + " using " + xslFile.getName());
        try {
            TransformerFactory factory = TransformerFactory.newInstance();
            Transformer transformer = factory.newTransformer(new StreamSource(xslFile));
            
            StringWriter writer = new StringWriter();
            transformer.transform(new StreamSource(xmlFile), new StreamResult(writer));
            
            if (outputFile != null) {
                transformer.transform(new StreamSource(xmlFile), new StreamResult(outputFile));
                System.out.println("[SUCCESS] Output HTML written to: " + outputFile.getAbsolutePath());
            }
            return writer.toString();
        } catch (Exception e) {
            System.out.println("[ERROR] Transformation failed: " + e.getMessage());
            return null;
        }
    }

    public static void main(String[] args) {
        System.out.println("==================================================");
        System.out.println("CAREER CONNECT - EXERCISE 7 XML/XSD/XSL PROCESSOR");
        System.out.println("==================================================");

        File xsdFile = new File("career.xsd");
        File validXml = new File("career.xml");
        File invalidXml = new File("career-invalid.xml");
        File xslFile = new File("career.xsl");
        File htmlOutput = new File("career-output.html");

        // 1. Validate valid XML
        boolean validRes = validateXml(validXml, xsdFile);

        // 2. Validate invalid XML
        boolean invalidRes = validateXml(invalidXml, xsdFile);

        // 3. Transform valid XML with XSL
        transformXml(validXml, xslFile, htmlOutput);

        System.out.println("==================================================");
        System.out.println("SUMMARY: Valid XML passed? " + validRes + " | Invalid XML rejected? " + (!invalidRes));
        System.out.println("==================================================");
    }
}
