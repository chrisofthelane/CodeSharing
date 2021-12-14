using System.Collections;
using UnityEngine;

[RequireComponent(typeof(AudioSource))]
public class FadingAudio : MonoBehaviour
{
    [Min(0f)] public float FadeInTime = 4f;
    [Min(0f)] public float FadeOutTime = 4f;
    
    private AudioSource _audioSource;
    private float _targetPeakVolume;
    private void Awake()
    {
        _audioSource = GetComponent<AudioSource>();
        _targetPeakVolume = _audioSource.volume;
        _audioSource.volume = 0;
    }

    public void FadeIn()
    {
        StopAllCoroutines();
        StartCoroutine(ProcessFadeIn());
    }

    public void FadeOut()
    {
        StopAllCoroutines();
        StartCoroutine(ProcessFadeOut());
    }

    IEnumerator ProcessFadeIn()
    {
        _audioSource.Play();
        
        float startingVolume = _audioSource.volume;
        float timeElapsed = 0;
        while (timeElapsed < FadeInTime)
        {
            _audioSource.volume = Mathf.Lerp(startingVolume, _targetPeakVolume, timeElapsed / FadeInTime);
            timeElapsed += Time.deltaTime;
            yield return null;
        }

        _audioSource.volume = _targetPeakVolume;
    }

    IEnumerator ProcessFadeOut()
    {
        float startingVolume = _audioSource.volume;
        float timeElapsed = 0;
        while (timeElapsed < FadeOutTime)
        {
            _audioSource.volume = Mathf.Lerp(startingVolume, 0, timeElapsed / FadeOutTime);
            timeElapsed += Time.deltaTime;
            yield return null;
        }

        _audioSource.volume = 0;
        _audioSource.Stop();
    }
}
