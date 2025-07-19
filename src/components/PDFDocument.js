// src/components/PDFDocument.js
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 20,
  },
  section: {
    margin: 10,
    padding: 10,
  },
  title: {
    fontSize: 20,
    marginBottom: 15,
    fontWeight: 'bold',
  },
  text: {
    fontSize: 12,
    marginBottom: 8,
  },
});

const PDFDocument = ({ searchResults }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text style={styles.title}>Sentiment Analysis Report</Text>
        {searchResults && searchResults.insights && searchResults.insights.key_findings && (
          <View>
            <Text style={{...styles.text, fontWeight: 'bold'}}>Key Findings:</Text>
            {searchResults.insights.key_findings.map((finding, index) => (
              <Text key={index} style={styles.text}>• {finding}</Text>
            ))}
          </View>
        )}
      </View>
    </Page>
  </Document>
);

export default PDFDocument;