import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

class AnimationUtils {
  // Kutlama animasyonu - Confetti efekti
  static Widget celebrationAnimation({
    double? width,
    double? height,
  }) {
    return Container(
      width: width ?? 200,
      height: height ?? 200,
      child: Stack(
        alignment: Alignment.center,
        children: [
          Icon(Icons.celebration, size: 80, color: Colors.amber)
              .animate(onPlay: (controller) => controller.repeat())
              .scale(duration: Duration(milliseconds: 600))
              .then()
              .scale(duration: Duration(milliseconds: 600)),
          ...List.generate(
            8,
            (index) => Positioned(
              child: Transform.translate(
                offset: Offset(40 * (index % 2 == 0 ? 1 : -1), -60),
                child: Icon(Icons.star, size: 24, color: Colors.amber)
                    .animate(onPlay: (controller) => controller.repeat())
                    .fadeOut(duration: Duration(milliseconds: 800)),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // Temizlik animasyonu - Spray efekti
  static Widget cleaningAnimation({
    double? width,
    double? height,
  }) {
    return Container(
      width: width ?? 150,
      height: height ?? 150,
      child: Icon(Icons.cleaning_services, size: 80, color: Colors.green)
          .animate(onPlay: (controller) => controller.repeat())
          .rotate(duration: Duration(milliseconds: 2000))
          .then()
          .scale(duration: Duration(milliseconds: 500))
          .then()
          .scale(duration: Duration(milliseconds: 500)),
    );
  }

  // Puan kazanma animasyonu
  static Widget pointsAnimation({
    double? width,
    double? height,
  }) {
    return Container(
      width: width ?? 120,
      height: height ?? 120,
      child: Stack(
        alignment: Alignment.center,
        children: [
          Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.star, size: 60, color: Colors.amber)
                  .animate(onPlay: (controller) => controller.repeat())
                  .scale(duration: Duration(milliseconds: 600))
                  .then()
                  .scale(duration: Duration(milliseconds: 600)),
              SizedBox(height: 8),
              Text(
                '+150 EP',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.amber,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // Loading spinner - animasyonlu döne döne
  static Widget loadingSpinner({
    double? size,
    Color? color,
  }) {
    return Icon(
      Icons.refresh,
      size: size ?? 60,
      color: color ?? Colors.green,
    )
        .animate(onPlay: (controller) => controller.repeat())
        .rotate(duration: Duration(seconds: 2));
  }

  // Success checkmark - bir sefer
  static Widget successCheckmark({
    double? size,
  }) {
    return Container(
      width: size ?? 100,
      height: size ?? 100,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: Colors.green.withValues(alpha: 0.1),
      ),
      child: Icon(
        Icons.check_circle,
        size: (size ?? 100) * 0.7,
        color: Colors.green,
      )
          .animate()
          .scale(duration: Duration(milliseconds: 600), curve: Curves.elasticOut),
    );
  }

  // Error mark
  static Widget errorMark({
    double? size,
  }) {
    return Container(
      width: size ?? 100,
      height: size ?? 100,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: Colors.red.withValues(alpha: 0.1),
      ),
      child: Icon(
        Icons.error_outline,
        size: (size ?? 100) * 0.7,
        color: Colors.red,
      )
          .animate()
          .shake(duration: Duration(milliseconds: 600)),
    );
  }
}

// Floating Action Button animasyonu
class FloatingActionButtonAnimated extends StatefulWidget {
  final VoidCallback onPressed;
  final IconData icon;
  final String tooltip;

  const FloatingActionButtonAnimated({
    required this.onPressed,
    required this.icon,
    this.tooltip = '',
  });

  @override
  _FloatingActionButtonAnimatedState createState() => _FloatingActionButtonAnimatedState();
}

class _FloatingActionButtonAnimatedState extends State<FloatingActionButtonAnimated>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: Duration(milliseconds: 500),
      vsync: this,
    );
    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ScaleTransition(
      scale: Tween<double>(begin: 0, end: 1).animate(
        CurvedAnimation(parent: _controller, curve: Curves.elasticOut),
      ),
      child: FloatingActionButton(
        onPressed: () {
          _controller.reverse().then((_) {
            widget.onPressed();
          });
        },
        tooltip: widget.tooltip,
        child: Icon(widget.icon),
      ),
    );
  }
}

// Slide ve Fade transition
class SlideFadeTransition extends StatefulWidget {
  final Widget child;
  final Duration duration;
  final Curve curve;

  const SlideFadeTransition({
    required this.child,
    this.duration = const Duration(milliseconds: 500),
    this.curve = Curves.easeInOut,
  });

  @override
  _SlideFadeTransitionState createState() => _SlideFadeTransitionState();
}

class _SlideFadeTransitionState extends State<SlideFadeTransition>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _opacity;
  late Animation<Offset> _slide;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(duration: widget.duration, vsync: this);
    _opacity = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _controller, curve: widget.curve),
    );
    _slide = Tween<Offset>(begin: Offset(0.3, 0), end: Offset.zero).animate(
      CurvedAnimation(parent: _controller, curve: widget.curve),
    );
    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SlideTransition(
      position: _slide,
      child: FadeTransition(opacity: _opacity, child: widget.child),
    );
  }
}

// Pulse animasyonu
class PulseAnimation extends StatefulWidget {
  final Widget child;
  final Duration duration;

  const PulseAnimation({
    required this.child,
    this.duration = const Duration(milliseconds: 1500),
  });

  @override
  _PulseAnimationState createState() => _PulseAnimationState();
}

class _PulseAnimationState extends State<PulseAnimation>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scale;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(duration: widget.duration, vsync: this)
      ..repeat(reverse: true);
    _scale = Tween<double>(begin: 1, end: 1.1).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ScaleTransition(scale: _scale, child: widget.child);
  }
}
