class PurdunyaState {
  int participants;
  bool isMissionActive;
  bool isCleaned;
  double ecoPoints;

  static const int maxParticipants = 5;
  static const double finishPoints = 150;

  PurdunyaState({this.participants = 3, this.isMissionActive = false, this.isCleaned = false, this.ecoPoints = 0});

  /// Returns true when the group reaches the max participants after joining.
  bool joinGroup() {
    if (participants < maxParticipants) {
      participants++;
      return participants == maxParticipants;
    }
    return false;
  }

  /// Starts cleaning only if group is full and mission isn't active or already cleaned.
  bool startCleaning() {
    if (participants == maxParticipants && !isMissionActive && !isCleaned) {
      isMissionActive = true;
      return true;
    }
    return false;
  }

  /// Finishes cleaning, awards points and marks the area cleaned.
  void finishCleaning() {
    if (isMissionActive && !isCleaned) {
      isMissionActive = false;
      isCleaned = true;
      ecoPoints += finishPoints;
    }
  }
}
