import React from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity, ScrollView } from 'react-native';

export default function FilterModal({ 
  visible, 
  onClose, 
  filters, 
  onApplyFilters, 
  onClearFilters 
}) {
  const [selectedCamera, setSelectedCamera] = React.useState(filters.cameraId || 'ALL');
  const [selectedClass, setSelectedClass] = React.useState(filters.detectionClass || 'ALL');
  const [minConfidence, setMinConfidence] = React.useState(filters.minConfidence || 50);

  // Sync state with incoming filter values when visible changes
  React.useEffect(() => {
    if (visible) {
      setSelectedCamera(filters.cameraId || 'ALL');
      setSelectedClass(filters.detectionClass || 'ALL');
      setMinConfidence(filters.minConfidence || 50);
    }
  }, [visible, filters]);

  const handleApply = () => {
    onApplyFilters({
      cameraId: selectedCamera === 'ALL' ? undefined : selectedCamera,
      detectionClass: selectedClass === 'ALL' ? undefined : selectedClass,
      minConfidence: minConfidence
    });
    onClose();
  };

  const handleClear = () => {
    setSelectedCamera('ALL');
    setSelectedClass('ALL');
    setMinConfidence(50);
    onClearFilters();
    onClose();
  };

  return (
    <Modal
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
      animationType="fade"
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>INFERENCE FILTER MATRIX</Text>
          
          <ScrollView style={styles.scroll}>
            {/* Camera Trap Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>CAMERA STATION</Text>
              <View style={styles.buttonGroup}>
                {['ALL', 'camera-01', 'camera-02', 'camera-03'].map((cam) => (
                  <TouchableOpacity 
                    key={cam} 
                    style={[styles.optionBtn, selectedCamera === cam && styles.selectedBtn]}
                    onPress={() => setSelectedCamera(cam)}
                  >
                    <Text style={[styles.optionText, selectedCamera === cam && styles.selectedText]}>
                      {cam.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Class Target */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>TARGET CLASSIFICATION</Text>
              <View style={styles.buttonGroup}>
                {['ALL', 'leopard_body', 'leopard_head', 'leopard_flank'].map((cls) => (
                  <TouchableOpacity 
                    key={cls} 
                    style={[styles.optionBtn, selectedClass === cls && styles.selectedBtn]}
                    onPress={() => setSelectedClass(cls)}
                  >
                    <Text style={[styles.optionText, selectedClass === cls && styles.selectedText]}>
                      {cls.replace('leopard_', '').toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Minimum Confidence */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>MINIMUM CONFIDENCE: {minConfidence}%</Text>
              <View style={styles.buttonGroup}>
                {[50, 60, 70, 80, 90].map((conf) => (
                  <TouchableOpacity 
                    key={conf} 
                    style={[styles.optionBtn, minConfidence === conf && styles.selectedBtn]}
                    onPress={() => setMinConfidence(conf)}
                  >
                    <Text style={[styles.optionText, minConfidence === conf && styles.selectedText]}>
                      {conf}%
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
              <Text style={styles.clearBtnText}>RESET ALL</Text>
            </TouchableOpacity>
            
            <View style={styles.rightActions}>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Text style={styles.closeBtnText}>CANCEL</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
                <Text style={styles.applyBtnText}>APPLY</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 13, 22, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    padding: 16,
  },
  title: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: 'bold',
    color: '#f8fafc',
    letterSpacing: 1.5,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    paddingBottom: 8,
    marginBottom: 16,
  },
  scroll: {
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontFamily: 'monospace',
    fontSize: 9,
    fontWeight: 'bold',
    color: '#64748b',
    marginBottom: 8,
    letterSpacing: 1,
  },
  buttonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  optionBtn: {
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  selectedBtn: {
    borderColor: '#38bdf8',
    backgroundColor: '#1e293b',
  },
  optionText: {
    fontFamily: 'monospace',
    fontSize: 9,
    color: '#94a3b8',
  },
  selectedText: {
    color: '#38bdf8',
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingTop: 12,
  },
  clearBtn: {
    paddingVertical: 6,
  },
  clearBtnText: {
    fontFamily: 'monospace',
    fontSize: 9,
    color: '#ef4444',
    fontWeight: 'bold',
  },
  rightActions: {
    flexDirection: 'row',
    gap: 12,
  },
  closeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  closeBtnText: {
    fontFamily: 'monospace',
    fontSize: 9,
    color: '#94a3b8',
    fontWeight: 'bold',
  },
  applyBtn: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#38bdf8',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  applyBtnText: {
    fontFamily: 'monospace',
    fontSize: 9,
    color: '#38bdf8',
    fontWeight: 'bold',
  },
});
