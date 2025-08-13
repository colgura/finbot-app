// screens/GlossaryScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
} from "react-native";
import glossaryData from "../data/glossary.json";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

export default function GlossaryScreen() {
  const navigation = useNavigation();
  const [search, setSearch] = useState("");
  const [filteredTerms, setFilteredTerms] = useState(glossaryData);
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const query = search.toLowerCase();
    const filtered = glossaryData.filter((item) =>
      item.term.toLowerCase().includes(query)
    );
    setFilteredTerms(filtered);
  }, [search]);

  const handleSelectTerm = (term) => {
    setSelectedTerm(term);
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Search financial terms…"
        style={styles.searchInput}
        value={search}
        onChangeText={setSearch}
      />

      <FlatList
        data={filteredTerms}
        keyExtractor={(item) => item.term}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.termRow}
            onPress={() => handleSelectTerm(item)}
          >
            <View>
              <Text style={styles.termTitle}>{item.term}</Text>
              <Text style={styles.termDef}>{item.definition}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#007AFF" />
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity
        style={styles.askBotButton}
        onPress={() => navigation.navigate("Chat", { initialQuery: search })}
      >
        <Ionicons name="chatbox-ellipses-outline" size={18} color="#fff" />
        <Text style={styles.askBotText}>Still unsure? Ask FinBot!</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>{selectedTerm?.term}</Text>
              <Text style={styles.modalDefinition}>
                {selectedTerm?.fullDefinition}
              </Text>
              {selectedTerm?.example && (
                <Text style={styles.modalExample}>
                  📘 Example: {selectedTerm.example}
                </Text>
              )}
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeText}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f4f6fc",
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtext: {
    fontSize: 16,
    color: "#555",
  },

  searchInput: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    borderColor: "#ccc",
    borderWidth: 1,
    marginBottom: 15,
  },
  termRow: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderColor: "#ddd",
    borderWidth: 1,
  },
  termTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  termDef: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  askBotButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#007bff",
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 15,
  },
  askBotText: {
    color: "#fff",
    fontSize: 16,
    marginLeft: 8,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalDefinition: {
    fontSize: 16,
    color: "#333",
    marginBottom: 10,
  },
  modalExample: {
    fontSize: 15,
    fontStyle: "italic",
    color: "#555",
    marginBottom: 20,
  },
  closeButton: {
    backgroundColor: "#007bff",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  closeText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
